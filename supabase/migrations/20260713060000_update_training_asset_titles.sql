update public.training_assets
set
  title = case id
    when 'training-loom-1' then 'Portico — Security Check-in SOP'
    when 'training-loom-2' then 'Vaidio Edge — LPR Training'
    when 'training-loom-3' then 'GoAccess Resident Training Demonstration'
    when 'training-loom-4' then 'Guard Tablet — Visitor Check-in'
  end,
  description = case id
    when 'training-loom-1' then 'Security check-in procedures for Portico.'
    when 'training-loom-2' then 'License plate recognition training for Vaidio Edge.'
    when 'training-loom-3' then 'Resident training demonstration for GoAccess.'
    when 'training-loom-4' then 'Visitor check-in training for the Guard Tablet.'
  end,
  updated_at = now()
where id in (
  'training-loom-1',
  'training-loom-2',
  'training-loom-3',
  'training-loom-4'
);
