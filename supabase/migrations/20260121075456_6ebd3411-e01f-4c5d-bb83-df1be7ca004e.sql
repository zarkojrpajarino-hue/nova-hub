-- Enable the triggers properly (change from 'O' to enabled)
ALTER TABLE obvs ENABLE TRIGGER trigger_notify_new_obv;
ALTER TABLE obv_validaciones ENABLE TRIGGER trigger_notify_obv_validation;
ALTER TABLE tasks ENABLE TRIGGER trigger_notify_task_assigned;
ALTER TABLE leads ENABLE TRIGGER trigger_notify_lead_won;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;