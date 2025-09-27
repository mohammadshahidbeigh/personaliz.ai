-- Initialize database with sample actors
-- This file is run when the PostgreSQL container starts for the first time

-- Insert sample actors
INSERT INTO "Actor" (id, name, description, "isActive") VALUES
('actor_1', 'Sarah Johnson', 'Professional female voice with warm, friendly tone. Perfect for personal messages and greetings.', true),
('actor_2', 'Michael Chen', 'Professional male voice with confident, engaging delivery. Ideal for business and formal communications.', true),
('actor_3', 'Emma Williams', 'Young, energetic female voice. Great for casual and upbeat personal messages.', true),
('actor_4', 'David Rodriguez', 'Deep, authoritative male voice. Excellent for professional announcements and formal content.', true)
ON CONFLICT (id) DO NOTHING;
