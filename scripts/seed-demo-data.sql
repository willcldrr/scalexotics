-- =====================================================
-- Scale Exotics Demo Data Seed Script
-- Run this in Supabase SQL Editor for product photos
-- =====================================================

DO $$
DECLARE
    admin_user_id UUID := '24939d7e-27c1-4857-9374-0596462442dd';
    vehicle_ids UUID[];
    i INTEGER;
    random_date TIMESTAMP;
    random_vehicle_id UUID;
BEGIN

-- =====================================================
-- 1. SEED VEHICLES (8 exotic cars)
-- =====================================================

DELETE FROM vehicles WHERE user_id = admin_user_id;

INSERT INTO vehicles (user_id, name, make, model, year, type, daily_rate, image_url, status, notes, created_at)
VALUES
    (admin_user_id, 'Lamborghini Huracán EVO', 'Lamborghini', 'Huracán EVO', 2024, 'Supercar', 1500, 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800', 'available', 'Pearl white with orange interior', NOW() - INTERVAL '90 days'),
    (admin_user_id, 'Ferrari F8 Spider', 'Ferrari', 'F8 Spider', 2023, 'Supercar', 1800, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800', 'rented', 'Rosso Corsa red, convertible', NOW() - INTERVAL '85 days'),
    (admin_user_id, 'McLaren 720S', 'McLaren', '720S', 2023, 'Supercar', 1600, 'https://images.unsplash.com/photo-1621135802920-133df287f89c?w=800', 'available', 'Papaya Spark orange', NOW() - INTERVAL '80 days'),
    (admin_user_id, 'Rolls Royce Cullinan', 'Rolls Royce', 'Cullinan', 2024, 'Luxury SUV', 1200, 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800', 'available', 'Black badge edition', NOW() - INTERVAL '75 days'),
    (admin_user_id, 'Bentley Continental GT', 'Bentley', 'Continental GT', 2023, 'Luxury', 950, 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800', 'available', 'Midnight emerald', NOW() - INTERVAL '70 days'),
    (admin_user_id, 'Porsche 911 Turbo S', 'Porsche', '911 Turbo S', 2024, 'Sports Car', 850, 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800', 'rented', 'GT Silver metallic', NOW() - INTERVAL '65 days'),
    (admin_user_id, 'Mercedes AMG GT', 'Mercedes', 'AMG GT', 2023, 'Sports Car', 750, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800', 'available', 'Designo diamond white', NOW() - INTERVAL '60 days'),
    (admin_user_id, 'Range Rover Sport SVR', 'Range Rover', 'Sport SVR', 2024, 'Luxury SUV', 650, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', 'available', 'Santorini black', NOW() - INTERVAL '55 days');

-- Get all vehicle IDs for bookings
SELECT ARRAY_AGG(id) INTO vehicle_ids FROM vehicles WHERE user_id = admin_user_id;

-- =====================================================
-- 2. SEED LEADS (127 leads with realistic distribution)
-- =====================================================

DELETE FROM leads WHERE user_id = admin_user_id;

-- New leads (35) - recent leads, growing over last 14 days
INSERT INTO leads (user_id, name, email, phone, status, source, vehicle_interest, notes, created_at) VALUES
(admin_user_id, 'James Wilson', 'james.wilson@gmail.com', '+13055551234', 'new', 'instagram', 'Lamborghini Huracán', 'Interested in weekend rental', NOW() - INTERVAL '2 hours'),
(admin_user_id, 'Michael Chen', 'michael.chen@gmail.com', '+13055552345', 'new', 'instagram', 'Ferrari F8', 'Birthday surprise', NOW() - INTERVAL '5 hours'),
(admin_user_id, 'Robert Martinez', 'robert.martinez@gmail.com', '+13055553456', 'new', 'google', 'McLaren 720S', 'Corporate event', NOW() - INTERVAL '8 hours'),
(admin_user_id, 'David Kim', 'david.kim@gmail.com', '+13055554567', 'new', 'instagram', 'Rolls Royce Cullinan', 'Wedding rental', NOW() - INTERVAL '1 day'),
(admin_user_id, 'Christopher Lee', 'christopher.lee@gmail.com', '+13055555678', 'new', 'google', 'Porsche 911', 'Photoshoot', NOW() - INTERVAL '1 day 3 hours'),
(admin_user_id, 'Daniel Brown', 'daniel.brown@gmail.com', '+13055556789', 'new', 'facebook', NULL, 'Music video', NOW() - INTERVAL '1 day 8 hours'),
(admin_user_id, 'Matthew Davis', 'matthew.davis@gmail.com', '+13055557890', 'new', 'instagram', 'Lamborghini Huracán', NULL, NOW() - INTERVAL '2 days'),
(admin_user_id, 'Andrew Garcia', 'andrew.garcia@gmail.com', '+13055558901', 'new', 'tiktok', 'Ferrari F8', 'Weekend getaway', NOW() - INTERVAL '2 days 4 hours'),
(admin_user_id, 'Joshua Rodriguez', 'joshua.rodriguez@gmail.com', '+13055559012', 'new', 'website', 'McLaren 720S', NULL, NOW() - INTERVAL '2 days 10 hours'),
(admin_user_id, 'Brandon Taylor', 'brandon.taylor@gmail.com', '+13055550123', 'new', 'instagram', NULL, 'Anniversary gift', NOW() - INTERVAL '3 days'),
(admin_user_id, 'Tyler Anderson', 'tyler.anderson@gmail.com', '+13055551111', 'new', 'referral', 'Bentley Continental', NULL, NOW() - INTERVAL '3 days 5 hours'),
(admin_user_id, 'Ryan Thomas', 'ryan.thomas@gmail.com', '+13055552222', 'new', 'lead_capture', 'Porsche 911', 'From widget', NOW() - INTERVAL '3 days 12 hours'),
(admin_user_id, 'Justin White', 'justin.white@gmail.com', '+13055553333', 'new', 'instagram', 'Lamborghini Huracán', NULL, NOW() - INTERVAL '4 days'),
(admin_user_id, 'Kevin Harris', 'kevin.harris@gmail.com', '+13055554444', 'new', 'google', 'Mercedes AMG GT', 'Business trip', NOW() - INTERVAL '4 days 6 hours'),
(admin_user_id, 'Jason Clark', 'jason.clark@gmail.com', '+13055555555', 'new', 'instagram', NULL, NULL, NOW() - INTERVAL '4 days 14 hours'),
(admin_user_id, 'Eric Lewis', 'eric.lewis@gmail.com', '+13055556666', 'new', 'facebook', 'Range Rover SVR', 'Family event', NOW() - INTERVAL '5 days'),
(admin_user_id, 'Brian Walker', 'brian.walker@gmail.com', '+13055557777', 'new', 'tiktok', 'Ferrari F8', NULL, NOW() - INTERVAL '5 days 8 hours'),
(admin_user_id, 'Steven Hall', 'steven.hall@gmail.com', '+13055558888', 'new', 'instagram', 'McLaren 720S', 'Content creation', NOW() - INTERVAL '6 days'),
(admin_user_id, 'Mark Young', 'mark.young@gmail.com', '+13055559999', 'new', 'google', NULL, NULL, NOW() - INTERVAL '6 days 4 hours'),
(admin_user_id, 'Paul Allen', 'paul.allen@gmail.com', '+13055550000', 'new', 'website', 'Lamborghini Huracán', 'Prom rental', NOW() - INTERVAL '7 days'),
(admin_user_id, 'Jeffrey King', 'jeffrey.king@gmail.com', '+13056661234', 'new', 'instagram', 'Rolls Royce Cullinan', NULL, NOW() - INTERVAL '7 days 6 hours'),
(admin_user_id, 'Scott Wright', 'scott.wright@gmail.com', '+13056662345', 'new', 'referral', 'Porsche 911', 'Track day', NOW() - INTERVAL '8 days'),
(admin_user_id, 'Patrick Lopez', 'patrick.lopez@gmail.com', '+13056663456', 'new', 'lead_capture', NULL, 'From website', NOW() - INTERVAL '8 days 10 hours'),
(admin_user_id, 'Nicholas Hill', 'nicholas.hill@gmail.com', '+13056664567', 'new', 'instagram', 'Ferrari F8', NULL, NOW() - INTERVAL '9 days'),
(admin_user_id, 'Timothy Scott', 'timothy.scott@gmail.com', '+13056665678', 'new', 'google', 'Bentley Continental', 'VIP client', NOW() - INTERVAL '9 days 8 hours'),
(admin_user_id, 'Gregory Green', 'gregory.green@gmail.com', '+13056666789', 'new', 'instagram', NULL, NULL, NOW() - INTERVAL '10 days'),
(admin_user_id, 'Kenneth Adams', 'kenneth.adams@gmail.com', '+13056667890', 'new', 'facebook', 'Mercedes AMG GT', 'Bachelor party', NOW() - INTERVAL '10 days 12 hours'),
(admin_user_id, 'Ronald Baker', 'ronald.baker@gmail.com', '+13056668901', 'new', 'tiktok', 'Lamborghini Huracán', NULL, NOW() - INTERVAL '11 days'),
(admin_user_id, 'Anthony Nelson', 'anthony.nelson@gmail.com', '+13056669012', 'new', 'instagram', 'McLaren 720S', 'Influencer', NOW() - INTERVAL '11 days 6 hours'),
(admin_user_id, 'Jonathan Carter', 'jonathan.carter@gmail.com', '+13056660123', 'new', 'google', NULL, NULL, NOW() - INTERVAL '12 days'),
(admin_user_id, 'Samuel Mitchell', 'samuel.mitchell@gmail.com', '+13057771234', 'new', 'website', 'Ferrari F8', 'Movie production', NOW() - INTERVAL '12 days 10 hours'),
(admin_user_id, 'Benjamin Perez', 'benjamin.perez@gmail.com', '+13057772345', 'new', 'instagram', 'Porsche 911', NULL, NOW() - INTERVAL '13 days'),
(admin_user_id, 'Nathan Roberts', 'nathan.roberts@gmail.com', '+13057773456', 'new', 'referral', 'Rolls Royce Cullinan', 'Luxury experience', NOW() - INTERVAL '13 days 8 hours'),
(admin_user_id, 'Adam Turner', 'adam.turner@gmail.com', '+13057774567', 'new', 'lead_capture', NULL, 'Widget submission', NOW() - INTERVAL '14 days'),
(admin_user_id, 'Henry Phillips', 'henry.phillips@gmail.com', '+13057775678', 'new', 'instagram', 'Lamborghini Huracán', 'Special occasion', NOW() - INTERVAL '14 days 4 hours');

-- Contacted leads (32) - spread over 7-21 days ago
INSERT INTO leads (user_id, name, email, phone, status, source, vehicle_interest, notes, created_at) VALUES
(admin_user_id, 'William Johnson', 'william.johnson@gmail.com', '+13058881234', 'contacted', 'instagram', 'Lamborghini Huracán', 'Sent pricing, awaiting response', NOW() - INTERVAL '7 days'),
(admin_user_id, 'Alexander Thompson', 'alexander.thompson@gmail.com', '+13058882345', 'contacted', 'google', 'Ferrari F8', 'Discussed availability', NOW() - INTERVAL '7 days 8 hours'),
(admin_user_id, 'Ethan Moore', 'ethan.moore@gmail.com', '+13058883456', 'contacted', 'instagram', 'McLaren 720S', 'Sent requirements', NOW() - INTERVAL '8 days'),
(admin_user_id, 'Noah Jackson', 'noah.jackson@gmail.com', '+13058884567', 'contacted', 'referral', 'Rolls Royce Cullinan', 'Pricing sent', NOW() - INTERVAL '8 days 12 hours'),
(admin_user_id, 'Lucas Martin', 'lucas.martin@gmail.com', '+13058885678', 'contacted', 'google', 'Porsche 911', 'Following up tomorrow', NOW() - INTERVAL '9 days'),
(admin_user_id, 'Mason Lee', 'mason.lee@gmail.com', '+13058886789', 'contacted', 'facebook', 'Bentley Continental', 'Sent contract', NOW() - INTERVAL '9 days 6 hours'),
(admin_user_id, 'Oliver White', 'oliver.white@gmail.com', '+13058887890', 'contacted', 'instagram', 'Mercedes AMG GT', 'Discussing dates', NOW() - INTERVAL '10 days'),
(admin_user_id, 'Elijah Harris', 'elijah.harris@gmail.com', '+13058888901', 'contacted', 'tiktok', 'Range Rover SVR', 'Sent info pack', NOW() - INTERVAL '10 days 10 hours'),
(admin_user_id, 'Aiden Clark', 'aiden.clark@gmail.com', '+13058889012', 'contacted', 'website', 'Lamborghini Huracán', 'Call scheduled', NOW() - INTERVAL '11 days'),
(admin_user_id, 'Sebastian Lewis', 'sebastian.lewis@gmail.com', '+13058880123', 'contacted', 'instagram', 'Ferrari F8', 'Pricing discussion', NOW() - INTERVAL '11 days 8 hours'),
(admin_user_id, 'Jack Robinson', 'jack.robinson@gmail.com', '+13059991234', 'contacted', 'google', 'McLaren 720S', 'Sent availability', NOW() - INTERVAL '12 days'),
(admin_user_id, 'Owen Walker', 'owen.walker@gmail.com', '+13059992345', 'contacted', 'referral', 'Porsche 911', 'Awaiting documents', NOW() - INTERVAL '12 days 14 hours'),
(admin_user_id, 'Liam Hall', 'liam.hall@gmail.com', '+13059993456', 'contacted', 'instagram', 'Rolls Royce Cullinan', 'Sent pricing', NOW() - INTERVAL '13 days'),
(admin_user_id, 'Carter Young', 'carter.young@gmail.com', '+13059994567', 'contacted', 'lead_capture', 'Bentley Continental', 'Following up', NOW() - INTERVAL '13 days 6 hours'),
(admin_user_id, 'Jayden Allen', 'jayden.allen@gmail.com', '+13059995678', 'contacted', 'google', 'Mercedes AMG GT', 'Sent contract', NOW() - INTERVAL '14 days'),
(admin_user_id, 'Gabriel King', 'gabriel.king@gmail.com', '+13059996789', 'contacted', 'instagram', 'Lamborghini Huracán', 'Discussed requirements', NOW() - INTERVAL '14 days 10 hours'),
(admin_user_id, 'Dylan Wright', 'dylan.wright@gmail.com', '+13059997890', 'contacted', 'facebook', 'Ferrari F8', 'Pricing sent', NOW() - INTERVAL '15 days'),
(admin_user_id, 'Luke Scott', 'luke.scott@gmail.com', '+13059998901', 'contacted', 'tiktok', 'Range Rover SVR', 'Call completed', NOW() - INTERVAL '15 days 8 hours'),
(admin_user_id, 'Isaac Green', 'isaac.green@gmail.com', '+13059999012', 'contacted', 'website', 'McLaren 720S', 'Sent info', NOW() - INTERVAL '16 days'),
(admin_user_id, 'Anthony Baker', 'anthony.baker@gmail.com', '+13059990123', 'contacted', 'instagram', 'Porsche 911', 'Awaiting response', NOW() - INTERVAL '16 days 12 hours'),
(admin_user_id, 'Leo Adams', 'leo.adams@gmail.com', '+13050001234', 'contacted', 'google', 'Bentley Continental', 'Sent availability', NOW() - INTERVAL '17 days'),
(admin_user_id, 'Lincoln Nelson', 'lincoln.nelson@gmail.com', '+13050002345', 'contacted', 'referral', 'Rolls Royce Cullinan', 'Pricing discussion', NOW() - INTERVAL '17 days 6 hours'),
(admin_user_id, 'Jaxon Hill', 'jaxon.hill@gmail.com', '+13050003456', 'contacted', 'instagram', 'Lamborghini Huracán', 'Following up', NOW() - INTERVAL '18 days'),
(admin_user_id, 'Asher Lopez', 'asher.lopez@gmail.com', '+13050004567', 'contacted', 'lead_capture', 'Ferrari F8', 'Sent contract', NOW() - INTERVAL '18 days 10 hours'),
(admin_user_id, 'Christopher Carter', 'chris.carter@gmail.com', '+13050005678', 'contacted', 'google', 'Mercedes AMG GT', 'Discussed dates', NOW() - INTERVAL '19 days'),
(admin_user_id, 'Ezra Mitchell', 'ezra.mitchell@gmail.com', '+13050006789', 'contacted', 'instagram', 'McLaren 720S', 'Sent pricing', NOW() - INTERVAL '19 days 8 hours'),
(admin_user_id, 'Theodore Perez', 'theodore.perez@gmail.com', '+13050007890', 'contacted', 'facebook', 'Porsche 911', 'Call scheduled', NOW() - INTERVAL '20 days'),
(admin_user_id, 'Thomas Roberts', 'thomas.roberts@gmail.com', '+13050008901', 'contacted', 'tiktok', 'Range Rover SVR', 'Awaiting docs', NOW() - INTERVAL '20 days 12 hours'),
(admin_user_id, 'Charles Turner', 'charles.turner@gmail.com', '+13050009012', 'contacted', 'website', 'Bentley Continental', 'Sent info pack', NOW() - INTERVAL '21 days'),
(admin_user_id, 'Caleb Phillips', 'caleb.phillips@gmail.com', '+13050000123', 'contacted', 'instagram', 'Lamborghini Huracán', 'Pricing sent', NOW() - INTERVAL '21 days 6 hours'),
(admin_user_id, 'Henry Evans', 'henry.evans@gmail.com', '+13051111234', 'contacted', 'google', 'Ferrari F8', 'Following up', NOW() - INTERVAL '21 days 12 hours'),
(admin_user_id, 'Ryan Collins', 'ryan.collins@gmail.com', '+13051112345', 'contacted', 'referral', 'Rolls Royce Cullinan', 'Sent contract', NOW() - INTERVAL '21 days 18 hours');

-- Qualified leads (25) - spread over 14-35 days ago
INSERT INTO leads (user_id, name, email, phone, status, source, vehicle_interest, notes, created_at) VALUES
(admin_user_id, 'Marcus Williams', 'marcus.williams@gmail.com', '+13052221234', 'qualified', 'instagram', 'Lamborghini Huracán', 'Verified ID, discussing dates', NOW() - INTERVAL '14 days'),
(admin_user_id, 'Derek Stone', 'derek.stone@gmail.com', '+13052222345', 'qualified', 'google', 'Ferrari F8', 'Insurance verified', NOW() - INTERVAL '15 days'),
(admin_user_id, 'Victor Hayes', 'victor.hayes@gmail.com', '+13052223456', 'qualified', 'referral', 'McLaren 720S', 'Ready to book', NOW() - INTERVAL '16 days'),
(admin_user_id, 'Adrian Foster', 'adrian.foster@gmail.com', '+13052224567', 'qualified', 'google', 'Rolls Royce Cullinan', 'Selecting dates', NOW() - INTERVAL '17 days'),
(admin_user_id, 'Dominic Rivera', 'dominic.rivera@gmail.com', '+13052225678', 'qualified', 'instagram', 'Porsche 911', 'Documents verified', NOW() - INTERVAL '18 days'),
(admin_user_id, 'Xavier Coleman', 'xavier.coleman@gmail.com', '+13052226789', 'qualified', 'website', 'Bentley Continental', 'Finalizing contract', NOW() - INTERVAL '19 days'),
(admin_user_id, 'Maxwell Barnes', 'maxwell.barnes@gmail.com', '+13052227890', 'qualified', 'lead_capture', 'Mercedes AMG GT', 'ID verified', NOW() - INTERVAL '20 days'),
(admin_user_id, 'Tristan Howard', 'tristan.howard@gmail.com', '+13052228901', 'qualified', 'google', 'Range Rover SVR', 'Insurance pending', NOW() - INTERVAL '21 days'),
(admin_user_id, 'Preston Ward', 'preston.ward@gmail.com', '+13052229012', 'qualified', 'instagram', 'Lamborghini Huracán', 'Ready to pay deposit', NOW() - INTERVAL '22 days'),
(admin_user_id, 'Garrett Brooks', 'garrett.brooks@gmail.com', '+13052220123', 'qualified', 'referral', 'Ferrari F8', 'All docs verified', NOW() - INTERVAL '23 days'),
(admin_user_id, 'Spencer Kelly', 'spencer.kelly@gmail.com', '+13053331234', 'qualified', 'google', 'McLaren 720S', 'Selecting dates', NOW() - INTERVAL '24 days'),
(admin_user_id, 'Colton Price', 'colton.price@gmail.com', '+13053332345', 'qualified', 'instagram', 'Porsche 911', 'Contract sent', NOW() - INTERVAL '25 days'),
(admin_user_id, 'Chase Bennett', 'chase.bennett@gmail.com', '+13053333456', 'qualified', 'website', 'Rolls Royce Cullinan', 'Verified customer', NOW() - INTERVAL '26 days'),
(admin_user_id, 'Blake Ross', 'blake.ross@gmail.com', '+13053334567', 'qualified', 'lead_capture', 'Bentley Continental', 'Ready to book', NOW() - INTERVAL '27 days'),
(admin_user_id, 'Grant Cooper', 'grant.cooper@gmail.com', '+13053335678', 'qualified', 'google', 'Mercedes AMG GT', 'Insurance verified', NOW() - INTERVAL '28 days'),
(admin_user_id, 'Reid Richardson', 'reid.richardson@gmail.com', '+13053336789', 'qualified', 'referral', 'Lamborghini Huracán', 'Finalizing', NOW() - INTERVAL '29 days'),
(admin_user_id, 'Shane Cox', 'shane.cox@gmail.com', '+13053337890', 'qualified', 'instagram', 'Ferrari F8', 'ID verified', NOW() - INTERVAL '30 days'),
(admin_user_id, 'Troy Murphy', 'troy.murphy@gmail.com', '+13053338901', 'qualified', 'google', 'Range Rover SVR', 'Docs complete', NOW() - INTERVAL '30 days 8 hours'),
(admin_user_id, 'Bryce Bailey', 'bryce.bailey@gmail.com', '+13053339012', 'qualified', 'website', 'McLaren 720S', 'Ready for deposit', NOW() - INTERVAL '31 days'),
(admin_user_id, 'Cole Reed', 'cole.reed@gmail.com', '+13053330123', 'qualified', 'instagram', 'Porsche 911', 'All verified', NOW() - INTERVAL '32 days'),
(admin_user_id, 'Nolan Bell', 'nolan.bell@gmail.com', '+13054441234', 'qualified', 'referral', 'Bentley Continental', 'Contract review', NOW() - INTERVAL '33 days'),
(admin_user_id, 'Parker Cook', 'parker.cook@gmail.com', '+13054442345', 'qualified', 'google', 'Rolls Royce Cullinan', 'Selecting dates', NOW() - INTERVAL '34 days'),
(admin_user_id, 'Austin Morgan', 'austin.morgan@gmail.com', '+13054443456', 'qualified', 'lead_capture', 'Lamborghini Huracán', 'Ready to book', NOW() - INTERVAL '34 days 12 hours'),
(admin_user_id, 'Hunter Sanders', 'hunter.sanders@gmail.com', '+13054444567', 'qualified', 'instagram', 'Ferrari F8', 'Insurance verified', NOW() - INTERVAL '35 days'),
(admin_user_id, 'Jordan Gray', 'jordan.gray@gmail.com', '+13054445678', 'qualified', 'google', 'Mercedes AMG GT', 'Verified VIP', NOW() - INTERVAL '35 days 8 hours');

-- Converted leads (28) - spread over 21-90 days showing steady growth
INSERT INTO leads (user_id, name, email, phone, status, source, vehicle_interest, notes, created_at) VALUES
(admin_user_id, 'Richard Chen', 'richard.chen@gmail.com', '+13055551234', 'converted', 'instagram', 'Lamborghini Huracán', 'Booked - great customer!', NOW() - INTERVAL '21 days'),
(admin_user_id, 'Steven Park', 'steven.park@gmail.com', '+13055552345', 'converted', 'google', 'Ferrari F8', 'Completed rental', NOW() - INTERVAL '24 days'),
(admin_user_id, 'Kevin Nguyen', 'kevin.nguyen@gmail.com', '+13055553456', 'converted', 'instagram', 'McLaren 720S', 'Repeat customer', NOW() - INTERVAL '27 days'),
(admin_user_id, 'Jason Lee', 'jason.lee@gmail.com', '+13055554567', 'converted', 'referral', 'Rolls Royce Cullinan', 'VIP booking', NOW() - INTERVAL '30 days'),
(admin_user_id, 'Brian Kim', 'brian.kim@gmail.com', '+13055555678', 'converted', 'google', 'Porsche 911', 'Booked successfully', NOW() - INTERVAL '33 days'),
(admin_user_id, 'Eric Wang', 'eric.wang@gmail.com', '+13055556789', 'converted', 'website', 'Bentley Continental', 'Great experience', NOW() - INTERVAL '36 days'),
(admin_user_id, 'Alex Liu', 'alex.liu@gmail.com', '+13055557890', 'converted', 'lead_capture', 'Mercedes AMG GT', 'Completed', NOW() - INTERVAL '39 days'),
(admin_user_id, 'Tony Zhang', 'tony.zhang@gmail.com', '+13055558901', 'converted', 'instagram', 'Range Rover SVR', 'Returning customer', NOW() - INTERVAL '42 days'),
(admin_user_id, 'Vincent Wu', 'vincent.wu@gmail.com', '+13055559012', 'converted', 'google', 'Lamborghini Huracán', 'Booked 3-day rental', NOW() - INTERVAL '45 days'),
(admin_user_id, 'Raymond Huang', 'raymond.huang@gmail.com', '+13055550123', 'converted', 'referral', 'Ferrari F8', 'VIP experience', NOW() - INTERVAL '48 days'),
(admin_user_id, 'Peter Lin', 'peter.lin@gmail.com', '+13056661234', 'converted', 'instagram', 'McLaren 720S', 'Completed rental', NOW() - INTERVAL '51 days'),
(admin_user_id, 'Gary Tan', 'gary.tan@gmail.com', '+13056662345', 'converted', 'google', 'Porsche 911', 'Great customer', NOW() - INTERVAL '54 days'),
(admin_user_id, 'Larry Cheng', 'larry.cheng@gmail.com', '+13056663456', 'converted', 'website', 'Rolls Royce Cullinan', 'Booked successfully', NOW() - INTERVAL '57 days'),
(admin_user_id, 'Dennis Ho', 'dennis.ho@gmail.com', '+13056664567', 'converted', 'lead_capture', 'Bentley Continental', 'Repeat booking', NOW() - INTERVAL '60 days'),
(admin_user_id, 'Roger Lim', 'roger.lim@gmail.com', '+13056665678', 'converted', 'instagram', 'Mercedes AMG GT', 'Completed', NOW() - INTERVAL '63 days'),
(admin_user_id, 'Arthur Ng', 'arthur.ng@gmail.com', '+13056666789', 'converted', 'referral', 'Lamborghini Huracán', 'VIP customer', NOW() - INTERVAL '66 days'),
(admin_user_id, 'Stanley Tran', 'stanley.tran@gmail.com', '+13056667890', 'converted', 'google', 'Ferrari F8', 'Booked', NOW() - INTERVAL '69 days'),
(admin_user_id, 'Howard Yee', 'howard.yee@gmail.com', '+13056668901', 'converted', 'instagram', 'Range Rover SVR', 'Great rental', NOW() - INTERVAL '72 days'),
(admin_user_id, 'Eugene Kwan', 'eugene.kwan@gmail.com', '+13056669012', 'converted', 'website', 'McLaren 720S', 'Completed', NOW() - INTERVAL '75 days'),
(admin_user_id, 'Philip Fong', 'philip.fong@gmail.com', '+13056660123', 'converted', 'lead_capture', 'Porsche 911', 'Repeat customer', NOW() - INTERVAL '78 days'),
(admin_user_id, 'George Chow', 'george.chow@gmail.com', '+13057771234', 'converted', 'google', 'Bentley Continental', 'Booked', NOW() - INTERVAL '80 days'),
(admin_user_id, 'Albert Tang', 'albert.tang@gmail.com', '+13057772345', 'converted', 'referral', 'Rolls Royce Cullinan', 'VIP experience', NOW() - INTERVAL '82 days'),
(admin_user_id, 'Frank Lai', 'frank.lai@gmail.com', '+13057773456', 'converted', 'instagram', 'Mercedes AMG GT', 'Great customer', NOW() - INTERVAL '84 days'),
(admin_user_id, 'Oscar Yeung', 'oscar.yeung@gmail.com', '+13057774567', 'converted', 'google', 'Lamborghini Huracán', 'Completed rental', NOW() - INTERVAL '85 days'),
(admin_user_id, 'Harry Chu', 'harry.chu@gmail.com', '+13057775678', 'converted', 'website', 'Ferrari F8', 'Booked successfully', NOW() - INTERVAL '86 days'),
(admin_user_id, 'Norman Leung', 'norman.leung@gmail.com', '+13057776789', 'converted', 'instagram', 'Range Rover SVR', 'Repeat booking', NOW() - INTERVAL '87 days'),
(admin_user_id, 'Ivan Chang', 'ivan.chang@gmail.com', '+13057777890', 'converted', 'lead_capture', 'McLaren 720S', 'VIP customer', NOW() - INTERVAL '88 days'),
(admin_user_id, 'Felix Lau', 'felix.lau@gmail.com', '+13057778901', 'converted', 'referral', 'Porsche 911', 'Great experience', NOW() - INTERVAL '90 days');

-- Lost leads (7) - spread across time periods
INSERT INTO leads (user_id, name, email, phone, status, source, vehicle_interest, notes, created_at) VALUES
(admin_user_id, 'Jake Miller', 'jake.miller@gmail.com', '+13058881234', 'lost', 'instagram', NULL, 'Budget too low', NOW() - INTERVAL '18 days'),
(admin_user_id, 'Sean Davis', 'sean.davis@gmail.com', '+13058882345', 'lost', 'facebook', 'Ferrari F8', 'Went with competitor', NOW() - INTERVAL '32 days'),
(admin_user_id, 'Chad Wilson', 'chad.wilson@gmail.com', '+13058883456', 'lost', 'tiktok', NULL, 'No response', NOW() - INTERVAL '45 days'),
(admin_user_id, 'Brad Taylor', 'brad.taylor@gmail.com', '+13058884567', 'lost', 'other', 'Lamborghini Huracán', 'Insurance issue', NOW() - INTERVAL '55 days'),
(admin_user_id, 'Dustin Moore', 'dustin.moore@gmail.com', '+13058885678', 'lost', 'instagram', NULL, 'Changed plans', NOW() - INTERVAL '65 days'),
(admin_user_id, 'Travis Martin', 'travis.martin@gmail.com', '+13058886789', 'lost', 'facebook', 'Porsche 911', 'Budget constraints', NOW() - INTERVAL '75 days'),
(admin_user_id, 'Keith Brown', 'keith.brown@gmail.com', '+13058887890', 'lost', 'other', NULL, 'No follow-up response', NOW() - INTERVAL '85 days');

-- =====================================================
-- 3. SEED BOOKINGS (34 bookings)
-- =====================================================

DELETE FROM bookings WHERE user_id = admin_user_id;

-- Completed bookings (18) - spread over 90 days showing consistent growth
INSERT INTO bookings (user_id, vehicle_id, customer_name, customer_email, customer_phone, start_date, end_date, total_amount, status, notes, created_at)
SELECT
    admin_user_id,
    (SELECT id FROM vehicles WHERE user_id = admin_user_id ORDER BY RANDOM() LIMIT 1),
    name, email, phone,
    created_at + INTERVAL '3 days',
    created_at + INTERVAL '5 days',
    amount,
    'completed',
    'Great rental experience',
    created_at
FROM (VALUES
    ('Richard Chen', 'richard.chen@gmail.com', '+13055551234', NOW() - INTERVAL '18 days', 4500),
    ('Steven Park', 'steven.park@gmail.com', '+13055552345', NOW() - INTERVAL '22 days', 5400),
    ('Kevin Nguyen', 'kevin.nguyen@gmail.com', '+13055553456', NOW() - INTERVAL '26 days', 3200),
    ('Jason Lee', 'jason.lee@gmail.com', '+13055554567', NOW() - INTERVAL '30 days', 3600),
    ('Brian Kim', 'brian.kim@gmail.com', '+13055555678', NOW() - INTERVAL '34 days', 2550),
    ('Eric Wang', 'eric.wang@gmail.com', '+13055556789', NOW() - INTERVAL '38 days', 2850),
    ('Alex Liu', 'alex.liu@gmail.com', '+13055557890', NOW() - INTERVAL '42 days', 2250),
    ('Tony Zhang', 'tony.zhang@gmail.com', '+13055558901', NOW() - INTERVAL '46 days', 1950),
    ('Vincent Wu', 'vincent.wu@gmail.com', '+13055559012', NOW() - INTERVAL '50 days', 4500),
    ('Raymond Huang', 'raymond.huang@gmail.com', '+13055550123', NOW() - INTERVAL '54 days', 5400),
    ('Peter Lin', 'peter.lin@gmail.com', '+13056661234', NOW() - INTERVAL '58 days', 4800),
    ('Gary Tan', 'gary.tan@gmail.com', '+13056662345', NOW() - INTERVAL '62 days', 2550),
    ('Larry Cheng', 'larry.cheng@gmail.com', '+13056663456', NOW() - INTERVAL '66 days', 3600),
    ('Dennis Ho', 'dennis.ho@gmail.com', '+13056664567', NOW() - INTERVAL '70 days', 2850),
    ('Roger Lim', 'roger.lim@gmail.com', '+13056665678', NOW() - INTERVAL '74 days', 2250),
    ('Arthur Ng', 'arthur.ng@gmail.com', '+13056666789', NOW() - INTERVAL '78 days', 4500),
    ('Stanley Tran', 'stanley.tran@gmail.com', '+13056667890', NOW() - INTERVAL '82 days', 5400),
    ('Howard Yee', 'howard.yee@gmail.com', '+13056668901', NOW() - INTERVAL '86 days', 1950)
) AS t(name, email, phone, created_at, amount);

-- Confirmed bookings (10) - upcoming bookings, booked over the last 2 weeks
INSERT INTO bookings (user_id, vehicle_id, customer_name, customer_email, customer_phone, start_date, end_date, total_amount, status, notes, created_at)
SELECT
    admin_user_id,
    (SELECT id FROM vehicles WHERE user_id = admin_user_id ORDER BY RANDOM() LIMIT 1),
    name, email, phone,
    start_dt,
    start_dt + INTERVAL '2 days',
    amount,
    'confirmed',
    'Deposit received',
    booked_at
FROM (VALUES
    ('Marcus Williams', 'marcus.williams@gmail.com', '+13052221234', NOW() + INTERVAL '1 day', 4500, NOW() - INTERVAL '3 days'),
    ('Derek Stone', 'derek.stone@gmail.com', '+13052222345', NOW() + INTERVAL '3 days', 5400, NOW() - INTERVAL '5 days'),
    ('Victor Hayes', 'victor.hayes@gmail.com', '+13052223456', NOW() + INTERVAL '5 days', 4800, NOW() - INTERVAL '4 days'),
    ('Adrian Foster', 'adrian.foster@gmail.com', '+13052224567', NOW() + INTERVAL '7 days', 3600, NOW() - INTERVAL '6 days'),
    ('Dominic Rivera', 'dominic.rivera@gmail.com', '+13052225678', NOW(), 2550, NOW() - INTERVAL '2 days'),
    ('Xavier Coleman', 'xavier.coleman@gmail.com', '+13052226789', NOW() + INTERVAL '4 days', 2850, NOW() - INTERVAL '7 days'),
    ('Maxwell Barnes', 'maxwell.barnes@gmail.com', '+13052227890', NOW() + INTERVAL '6 days', 2250, NOW() - INTERVAL '8 days'),
    ('Tristan Howard', 'tristan.howard@gmail.com', '+13052228901', NOW() + INTERVAL '9 days', 1950, NOW() - INTERVAL '10 days'),
    ('Preston Ward', 'preston.ward@gmail.com', '+13052229012', NOW() + INTERVAL '2 days', 4500, NOW() - INTERVAL '4 days'),
    ('Garrett Brooks', 'garrett.brooks@gmail.com', '+13052220123', NOW() + INTERVAL '11 days', 5400, NOW() - INTERVAL '12 days')
) AS t(name, email, phone, start_dt, amount, booked_at);

-- Pending bookings (6) - recent inquiries awaiting deposit
INSERT INTO bookings (user_id, vehicle_id, customer_name, customer_email, customer_phone, start_date, end_date, total_amount, status, notes, created_at)
SELECT
    admin_user_id,
    (SELECT id FROM vehicles WHERE user_id = admin_user_id ORDER BY RANDOM() LIMIT 1),
    name, email, phone,
    start_dt,
    start_dt + INTERVAL '3 days',
    amount,
    'pending',
    'Awaiting deposit',
    booked_at
FROM (VALUES
    ('James Wilson', 'james.wilson@gmail.com', '+13055551234', NOW() + INTERVAL '14 days', 4500, NOW() - INTERVAL '1 day'),
    ('Michael Chen', 'michael.chen@gmail.com', '+13055552345', NOW() + INTERVAL '18 days', 5400, NOW() - INTERVAL '2 days'),
    ('Robert Martinez', 'robert.martinez@gmail.com', '+13055553456', NOW() + INTERVAL '12 days', 4800, NOW() - INTERVAL '1 day'),
    ('David Kim', 'david.kim@gmail.com', '+13055554567', NOW() + INTERVAL '21 days', 3600, NOW() - INTERVAL '3 days'),
    ('Christopher Lee', 'christopher.lee@gmail.com', '+13055555678', NOW() + INTERVAL '16 days', 2550, NOW() - INTERVAL '2 days'),
    ('Daniel Brown', 'daniel.brown@gmail.com', '+13055556789', NOW() + INTERVAL '25 days', 2250, NOW() - INTERVAL '4 days')
) AS t(name, email, phone, start_dt, amount, booked_at);

RAISE NOTICE 'Demo data seeded successfully!';
RAISE NOTICE 'Vehicles: 8';
RAISE NOTICE 'Leads: 127 (35 new, 32 contacted, 25 qualified, 28 converted, 7 lost)';
RAISE NOTICE 'Bookings: 34 (18 completed, 10 confirmed, 6 pending)';

END $$;
