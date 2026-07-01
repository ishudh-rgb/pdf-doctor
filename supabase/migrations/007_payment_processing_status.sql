-- Allow atomic payment fulfillment claim (pending → processing → completed)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));
