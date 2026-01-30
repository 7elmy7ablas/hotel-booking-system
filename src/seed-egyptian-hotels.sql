-- Clear existing data (optional - comment out if you want to keep existing data)
DELETE FROM Rooms;
DELETE FROM Hotels;

-- Insert Egyptian Hotels
INSERT INTO Hotels (Id, Name, Location, Description, Rating, Amenities, CreatedAt, UpdatedAt, IsDeleted, DeletedAt)
VALUES
('B19C1D5D-EFA5-4A91-827F-1A1F5F2900A1', 'Nile Palace Hotel', 'Cairo, Egypt', 'Hotel on the Nile river with city view, pool, free breakfast.', 4.5, 'Free WiFi,Pool,Free Breakfast,Nile View,Restaurant', GETUTCDATE(), NULL, 0, NULL),
('5A38980A-0961-4D56-8807-8D0E83B57B3E', 'Azure Beach Resort', 'Alexandria, Egypt', 'Beachfront resort with modern rooms and sea view.', 4.2, 'Beach Access,Restaurant,Sea View,Free WiFi', GETUTCDATE(), NULL, 0, NULL),
('F31B8E7B-29AA-4BA9-99A9-0B4F824CE89C', 'Downtown Grand Hotel', 'Cairo, Egypt', 'Luxury city hotel in the heart of downtown.', 4.0, 'Free WiFi,Bar,Restaurant,City View', GETUTCDATE(), NULL, 0, NULL),
('29DE6ADA-B25B-44D2-8FFA-76328C4CEB4D', 'Pyramids City Resort', 'Giza, Egypt', 'Resort near the Pyramids of Giza with spa and pool.', 4.7, 'Spa,Pool,Pyramids View,Restaurant,Free WiFi', GETUTCDATE(), NULL, 0, NULL),
('ED757A84-6A58-4E0B-8F18-2E170814E698', 'Luxor Heritage Inn', 'Luxor, Egypt', 'Traditional inn with rooftop terrace overlooking the Nile.', 4.3, 'Rooftop Terrace,Nile View,Restaurant,Free WiFi', GETUTCDATE(), NULL, 0, NULL),
('C1ED0976-E8A9-4FD5-89C7-2BD9BA098C2D', 'Sharm El-Sheikh Family Suites', 'Sharm El-Sheikh, Egypt', 'All-inclusive resort for families and children.', 4.6, 'All-Inclusive,Kids Club,Pool,Beach Access,Restaurant', GETUTCDATE(), NULL, 0, NULL),
('870983C6-D97E-43A8-9ECF-3F3D9C9575F7', 'Red Sea Breeze Resort', 'Hurghada, Egypt', 'Resort with private beach and diving school.', 4.1, 'Private Beach,Diving School,Pool,Restaurant,Free WiFi', GETUTCDATE(), NULL, 0, NULL),
('6E82C08B-BD23-412D-A8BB-B990A4B4DB63', 'Aswan Sun Plaza', 'Aswan, Egypt', 'Affordable hotel near the Corniche.', 3.9, 'Free WiFi,Restaurant,Corniche View', GETUTCDATE(), NULL, 0, NULL),
('25A75F8B-06E5-4DEA-BF9D-1E208B3F17B6', 'Delta Urban Hotel', 'Mansoura, Egypt', 'Modern business hotel with restaurant and gym.', 4.0, 'Free WiFi,Gym,Restaurant,Business Center', GETUTCDATE(), NULL, 0, NULL),
('A5FE011F-8469-492F-8A1B-788129714537', 'Port Saeed Bay Resort', 'Port Said, Egypt', 'Beachside resort with sea views and large pool.', 4.2, 'Beach Access,Pool,Sea View,Restaurant,Free WiFi', GETUTCDATE(), NULL, 0, NULL),
('DED9397C-410A-4580-8A8F-226EA5A59EEC', 'Siwa Oasis Guest House', 'Siwa, Egypt', 'Eco-friendly guesthouse in Siwa Oasis.', 4.8, 'Eco-Friendly,Desert View,Traditional Food,Free WiFi', GETUTCDATE(), NULL, 0, NULL);

-- Insert Rooms for each hotel
INSERT INTO Rooms (Id, HotelId, RoomType, PricePerNight, Capacity, IsAvailable, CreatedAt, UpdatedAt, IsDeleted, DeletedAt)
VALUES
-- Nile Palace Hotel
(NEWID(), 'B19C1D5D-EFA5-4A91-827F-1A1F5F2900A1', 'Single', 60, 1, 1, GETUTCDATE(), NULL, 0, NULL),
(NEWID(), 'B19C1D5D-EFA5-4A91-827F-1A1F5F2900A1', 'Double', 90, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Azure Beach Resort
(NEWID(), '5A38980A-0961-4D56-8807-8D0E83B57B3E', 'Standard', 85, 2, 1, GETUTCDATE(), NULL, 0, NULL),
(NEWID(), '5A38980A-0961-4D56-8807-8D0E83B57B3E', 'Suite', 150, 4, 1, GETUTCDATE(), NULL, 0, NULL),

-- Downtown Grand Hotel
(NEWID(), 'F31B8E7B-29AA-4BA9-99A9-0B4F824CE89C', 'Standard', 70, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Pyramids City Resort
(NEWID(), '29DE6ADA-B25B-44D2-8FFA-76328C4CEB4D', 'Queen', 95, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Luxor Heritage Inn
(NEWID(), 'ED757A84-6A58-4E0B-8F18-2E170814E698', 'Standard', 50, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Sharm El-Sheikh Family Suites
(NEWID(), 'C1ED0976-E8A9-4FD5-89C7-2BD9BA098C2D', 'Family Suite', 130, 5, 1, GETUTCDATE(), NULL, 0, NULL),

-- Red Sea Breeze Resort
(NEWID(), '870983C6-D97E-43A8-9ECF-3F3D9C9575F7', 'Sea View', 110, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Aswan Sun Plaza
(NEWID(), '6E82C08B-BD23-412D-A8BB-B990A4B4DB63', 'Basic', 30, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Delta Urban Hotel
(NEWID(), '25A75F8B-06E5-4DEA-BF9D-1E208B3F17B6', 'Business', 75, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Port Saeed Bay Resort
(NEWID(), 'A5FE011F-8469-492F-8A1B-788129714537', 'Standard', 80, 2, 1, GETUTCDATE(), NULL, 0, NULL),

-- Siwa Oasis Guest House
(NEWID(), 'DED9397C-410A-4580-8A8F-226EA5A59EEC', 'Eco Room', 65, 2, 1, GETUTCDATE(), NULL, 0, NULL);

-- Verify the data
SELECT COUNT(*) AS TotalHotels FROM Hotels WHERE IsDeleted = 0;
SELECT COUNT(*) AS TotalRooms FROM Rooms WHERE IsDeleted = 0;
SELECT Name, Location, Rating FROM Hotels WHERE IsDeleted = 0 ORDER BY Name;
