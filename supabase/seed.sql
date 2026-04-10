-- Seed data for NBA portal
-- Replace auth_user_id values with real auth.users IDs from your Supabase project

insert into public.users (auth_user_id, email, role)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@college.edu', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'faculty1@college.edu', 'faculty'),
  ('33333333-3333-3333-3333-333333333333', 'faculty2@college.edu', 'faculty')
on conflict (auth_user_id) do nothing;

insert into public.faculty (
  id, user_id, name, designation, department, email, phone, photo_url, research_area, bio,
  experience_teaching, experience_industry, is_approved, created_by, approved_by, approved_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'V. B. Nikam',
    'Professor',
    'Computer Engineering and IT',
    'vbnikam@it.vjti.ac.in',
    '+91 9000000001',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    'Data Mining, Machine Learning, Cloud Computing, Deep Learning',
    'Faculty member with focus on scalable data systems and GPU-enabled analytics.',
    23,
    5,
    true,
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'Mahesh Shirole',
    'Professor',
    'Computer Engineering and IT',
    'mrshirole@it.vjti.ac.in',
    '+91 9000000002',
    'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=400',
    'Software Engineering, Blockchain, Cyber Security',
    'Faculty member with contributions in UML testing and blockchain systems.',
    20,
    3,
    true,
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    now()
  )
on conflict (id) do nothing;

insert into public.qualifications (faculty_id, degree, specialization, institute, year, is_approved, created_by, approved_by, approved_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B.E.', 'Computer Science and Engineering', 'Government College of Engineering, Aurangabad', 1993, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'M.E.', 'Computer Engineering', 'VJTI, Mumbai', 2002, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ph.D.', 'Computer Engineering', 'VJTI, Mumbai', 2016, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'B.E.', 'Computer Science and Engineering', 'WCE, Sangli', 1998, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.publications (faculty_id, title, authors, journal, year, doi, type, indexed, scopus, wos, is_approved, created_by, approved_by, approved_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Concurrent Behavioral Coverage Criteria for Sequence Diagrams', 'Shirole, M.; Kumar, R.', 'Innovations in Systems and Software Engineering', 2023, '', 'Journal', 'Scopus', true, false, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Concurrency Coverage Criteria for Activity Diagrams', 'Shirole, M.; Kumar, R.', 'IET Software', 2021, '', 'Journal', 'SCI', true, true, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.fdp (faculty_id, title, role, duration, start_date, end_date, organized_by, is_approved, created_by, approved_by, approved_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NBA Accreditation Readiness Workshop', 'Participant', '5 days', '2025-07-10', '2025-07-14', 'AICTE', true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.projects (faculty_id, title, funding_agency, amount, year, status, is_approved, created_by, approved_by, approved_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GPU Based Video Analytics Framework', 'NVIDIA', 1500000, 2024, 'Ongoing', true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.consultancy (faculty_id, title, company, amount, year, is_approved, created_by, approved_by, approved_at)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Blockchain Security Audit', 'FinTech Labs', 350000, 2025, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.patents (faculty_id, title, status, year, number, is_approved, created_by, approved_by, approved_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AI Assisted Multimedia Threat Detection', 'Filed', 2025, 'IN2025XXXX', true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.awards (faculty_id, title, year, description, is_approved, created_by, approved_by, approved_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NVIDIA CUDA Teaching Grant', 2013, 'Donation grant for GPU teaching and research', true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.moocs (faculty_id, course, platform, grade, year, is_approved, created_by, approved_by, approved_at)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Advanced Software Testing', 'NPTEL', 'Elite', 2024, true, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;
