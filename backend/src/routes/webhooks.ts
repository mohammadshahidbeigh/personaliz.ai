import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/webhook/whatsapp
 * Handle WhatsApp status webhooks from Twilio/WATI
 */
router.post('/whatsapp', async (req: express.Request, res: express.Response) => {
  try {
    const webhookData = req.body;
    
    console.log('📱 Received WhatsApp webhook:', JSON.stringify(webhookData, null, 2));

    // Extract message SID and status from Twilio webhook
    const messageSid = webhookData.MessageSid || webhookData.Sid;
    const status = webhookData.MessageStatus || webhookData.Status;
    const to = webhookData.To || webhookData.to;

    if (!messageSid || !status) {
      console.warn('⚠️ Incomplete webhook data received');
      return res.status(400).json({ error: 'Missing required webhook data' });
    }

    // Find the personalization record by WhatsApp message ID
    const personalization = await prisma.personalization.findFirst({
      where: { whatsappMsgId: messageSid }
    });

    if (!personalization) {
      console.warn(`⚠️ No personalization found for message SID: ${messageSid}`);
      return res.status(404).json({ error: 'Personalization not found' });
    }

    // Update personalization status based on webhook status
    let newStatus = personalization.status;
    let eventType = 'whatsapp_status_update';

    switch (status.toLowerCase()) {
      case 'delivered':
        newStatus = 'delivered';
        eventType = 'delivered';
        break;
      case 'read':
        newStatus = 'read';
        eventType = 'read';
        break;
      case 'failed':
      case 'undelivered':
        newStatus = 'failed';
        eventType = 'failed';
        break;
      case 'sent':
        // Keep as 'sent' if not already delivered/read
        if (personalization.status === 'sent') {
          newStatus = 'sent';
        }
        break;
      default:
        console.log(`📊 Unknown status received: ${status}`);
    }

    // Update the personalization record
    await prisma.personalization.update({
      where: { id: personalization.id },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Log the event
    await prisma.event.create({
      data: {
        personalizationId: personalization.id,
        type: eventType,
        payload: {
          messageSid,
          status,
          to,
          timestamp: new Date().toISOString(),
          webhookData
        }
      }
    });

    console.log(`✅ Updated personalization ${personalization.id} status to: ${newStatus}`);

    res.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      personalizationId: personalization.id,
      newStatus 
    });

  } catch (error: any) {
    console.error('❌ Error processing WhatsApp webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process webhook' 
    });
  }
});

/**
 * POST /api/webhook/sync
 * Handle SyncLabs job completion webhooks (if supported)
 */
router.post('/sync', async (req: express.Request, res: express.Response) => {
  try {
    const webhookData = req.body;
    
    console.log('🎬 Received SyncLabs webhook:', JSON.stringify(webhookData, null, 2));

    const jobId = webhookData.job_id || webhookData.jobId || webhookData.id;
    const status = webhookData.status;
    const outputUrl = webhookData.output_url || webhookData.outputUrl || webhookData.result_url;

    if (!jobId || !status) {
      console.warn('⚠️ Incomplete SyncLabs webhook data received');
      return res.status(400).json({ error: 'Missing required webhook data' });
    }

    // Find the personalization record by sync job ID
    const personalization = await prisma.personalization.findFirst({
      where: { syncJobId: jobId }
    });

    if (!personalization) {
      console.warn(`⚠️ No personalization found for sync job ID: ${jobId}`);
      return res.status(404).json({ error: 'Personalization not found' });
    }

    let newStatus = personalization.status;
    let eventType = 'sync_status_update';

    switch (status.toLowerCase()) {
      case 'completed':
        if (outputUrl) {
          newStatus = 'ready';
          eventType = 'sync_completed';
          
          // Update with video URL
          await prisma.personalization.update({
            where: { id: personalization.id },
            data: { 
              videoUrl: outputUrl,
              status: newStatus,
              updatedAt: new Date()
            }
          });
        }
        break;
      case 'failed':
      case 'error':
        newStatus = 'failed';
        eventType = 'sync_failed';
        
        await prisma.personalization.update({
          where: { id: personalization.id },
          data: { 
            status: newStatus,
            updatedAt: new Date()
          }
        });
        break;
      default:
        console.log(`📊 Unknown sync status received: ${status}`);
    }

    // Log the event
    await prisma.event.create({
      data: {
        personalizationId: personalization.id,
        type: eventType,
        payload: {
          jobId,
          status,
          outputUrl,
          timestamp: new Date().toISOString(),
          webhookData
        }
      }
    });

    console.log(`✅ Updated personalization ${personalization.id} sync status to: ${newStatus}`);

    res.json({ 
      success: true, 
      message: 'Sync webhook processed successfully',
      personalizationId: personalization.id,
      newStatus 
    });

  } catch (error: any) {
    console.error('❌ Error processing SyncLabs webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process sync webhook' 
    });
  }
});

/**
 * GET /api/webhook/test
 * Test webhook endpoint
 */
router.get('/test', (req: express.Request, res: express.Response) => {
  res.json({ 
    success: true, 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
