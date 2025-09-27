import express from 'express';
import { PrismaClient } from '@prisma/client';
import syncLabsService from '../utils/syncLabs';
import whatsappService from '../utils/whatsapp';

const router = express.Router();
const prisma = new PrismaClient();

interface GenerateRequest {
  name: string;
  city: string;
  phone: string;
  actorId: string;
}

interface GenerateResponse {
  success: boolean;
  personalizationId: number;
  videoUrl?: string;
  message?: string;
  error?: string;
}

/**
 * POST /api/generate
 * Generate personalized video and send via WhatsApp
 */
router.post('/', async (req: express.Request, res: express.Response) => {
  const { name, city, phone, actorId }: GenerateRequest = req.body;

  // Validation
  if (!name || !city || !phone || !actorId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, city, phone, actorId'
    });
  }

  // Validate phone number
  if (!whatsappService.validatePhoneNumber(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number format. Please use international format (e.g., +1234567890)'
    });
  }

  // Validate actor exists
  const actor = await prisma.actor.findUnique({
    where: { id: actorId }
  });

  if (!actor) {
    return res.status(400).json({
      success: false,
      error: 'Invalid actor ID'
    });
  }

  let personalizationId: number = 0;

  try {
    console.log(`🎬 Starting personalization for ${name} from ${city}`);

    // 1. Create initial record
    const personalization = await prisma.personalization.create({
      data: {
        name,
        city,
        phone: whatsappService.formatPhoneNumber(phone),
        actorId,
        status: 'queued'
      }
    });

    personalizationId = personalization.id;

    // Log initial event
    await prisma.event.create({
      data: {
        personalizationId,
        type: 'request',
        payload: { name, city, phone: whatsappService.formatPhoneNumber(phone), actorId }
      }
    });

    console.log(`📝 Created personalization record: ${personalizationId}`);

    // 2. Generate personalized text script
    const personalizedText = `Hello ${name} from ${city}, this is a personalized message just for you. We hope you're having a wonderful day in ${city}!`;

    // 3. Create cloned audio using SyncLabs
    console.log(`🎤 Generating cloned audio for actor ${actorId}...`);
    const audioUrl = await syncLabsService.createClonedAudio({
      actorId,
      text: personalizedText,
      personalizationId
    });

    // 4. Create lipsync job
    console.log(`🎬 Creating lipsync job...`);
    const originalVideoId = process.env.ORIGINAL_VIDEO_ID;
    
    if (!originalVideoId) {
      throw new Error('ORIGINAL_VIDEO_ID not configured in environment variables');
    }

    const syncJob = await syncLabsService.createLipsyncJob({
      actorId,
      audioUrl,
      originalVideoId
    });

    // Update record with sync job ID
    await prisma.personalization.update({
      where: { id: personalizationId },
      data: { 
        syncJobId: syncJob.id,
        status: 'sync_submitted'
      }
    });

    // Log sync submission event
    await prisma.event.create({
      data: {
        personalizationId,
        type: 'sync_submitted',
        payload: { jobId: syncJob.id, status: syncJob.status }
      }
    });

    console.log(`✅ Sync job submitted: ${syncJob.id}`);

    // 5. Wait for job completion (with timeout)
    const maxWaitTime = parseInt(process.env.SYNC_MAX_WAIT_TIME || '300000'); // 5 minutes default
    const videoUrl = await syncLabsService.waitForJobCompletion(syncJob.id, maxWaitTime);

    // Update record with video URL
    await prisma.personalization.update({
      where: { id: personalizationId },
      data: { 
        videoUrl,
        status: 'ready'
      }
    });

    // Log sync completion event
    await prisma.event.create({
      data: {
        personalizationId,
        type: 'sync_completed',
        payload: { videoUrl, jobId: syncJob.id }
      }
    });

    console.log(`✅ Video generated successfully: ${videoUrl}`);

    // 6. Send via WhatsApp
    console.log(`📱 Sending video via WhatsApp to ${phone}...`);
    
    const whatsappMessage = `Hi ${name}! Here's your personalized video from ${city}. Enjoy! 🎬`;
    
    const whatsappResponse = await whatsappService.sendMessage({
      to: whatsappService.formatPhoneNumber(phone),
      mediaUrl: videoUrl,
      body: whatsappMessage
    });

    // Update record with WhatsApp message ID and status
    await prisma.personalization.update({
      where: { id: personalizationId },
      data: { 
        whatsappMsgId: whatsappResponse.sid,
        status: whatsappResponse.status === 'failed' ? 'failed' : 'sent'
      }
    });

    // Log WhatsApp sent event
    await prisma.event.create({
      data: {
        personalizationId,
        type: 'whatsapp_sent',
        payload: {
          messageId: whatsappResponse.sid,
          status: whatsappResponse.status,
          to: whatsappResponse.to,
          error: whatsappResponse.errorMessage
        }
      }
    });

    if (whatsappResponse.status === 'failed') {
      throw new Error(`WhatsApp delivery failed: ${whatsappResponse.errorMessage}`);
    }

    console.log(`✅ WhatsApp message sent successfully: ${whatsappResponse.sid}`);

    // Return success response
    const response: GenerateResponse = {
      success: true,
      personalizationId,
      videoUrl,
      message: 'Personalized video generated and sent successfully!'
    };

    res.json(response);

  } catch (error: any) {
    console.error(`❌ Error in personalization flow:`, error.message);

    // Update status to failed if we have a personalization ID
    if (personalizationId) {
      try {
        await prisma.personalization.update({
          where: { id: personalizationId },
          data: { status: 'failed' }
        });

        await prisma.event.create({
          data: {
            personalizationId,
            type: 'failed',
            payload: { error: error.message, timestamp: new Date().toISOString() }
          }
        });
      } catch (dbError) {
        console.error('Failed to update failed status:', dbError);
      }
    }

    const response: GenerateResponse = {
      success: false,
      personalizationId: personalizationId || 0,
      error: error.message
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/generate/:id
 * Get personalization status and details
 */
router.get('/:id', async (req: express.Request, res: express.Response) => {
  const personalizationId = parseInt(req.params.id);

  if (isNaN(personalizationId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid personalization ID'
    });
  }

  try {
    const personalization = await prisma.personalization.findUnique({
      where: { id: personalizationId },
      include: {
        events: {
          orderBy: { createdAt: 'asc' }
        },
        // Include actor details if needed
      }
    });

    if (!personalization) {
      return res.status(404).json({
        success: false,
        error: 'Personalization not found'
      });
    }

    res.json({
      success: true,
      personalization
    });

  } catch (error: any) {
    console.error('Error fetching personalization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personalization details'
    });
  }
});

export default router;
