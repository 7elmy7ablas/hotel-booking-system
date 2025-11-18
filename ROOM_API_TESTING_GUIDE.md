# Room API Testing Guide

## Quick Test Commands

### Prerequisites
1. Stop the running API (if running)
2. Start the API: `cd src/HotelBooking.API && dotnet run`
3. API will be available at: `https://localhost:7291`
4. Swagger UI: `https://localhost:7291/swagger`

---

## Test Sequence

### Step 1: Create a Hotel First
```bash
curl -X POST https://localhost:7291/api/hotels \
  -H "Content-Type: application/json" \
  -k \
  -d "{
    \"Name\": \"Grand Plaza Hotel\",
    \"Location\": \"New York, USA\",
    \"Description\": \"Luxury hotel in downtown Manhattan\",
    \"Rating\": 4.5,
    \"Amenities\": \"WiFi, Pool, Gym, Restaurant\"
  }"
```

**Expected Response**: 201 Created with Hotel object containing `Id`
**Save the Hotel Id** for next steps!

---

### Step 2: Create a Room (POST /api/rooms)

```bash
# Replace {HOTEL_ID} with the actual hotel ID from Step 1
curl -X POST https://localhost:7291/api/rooms \
  -H "Content-Type: application/json" \
  -k \
  -d "{
    \"HotelId\": \"{HOTEL_ID}\",
    \"RoomType\": \"Deluxe Suite\",
    \"PricePerNight\": 250.00,
    \"Capacity\": 2,
    \"IsAvailable\": true
  }"
```

**Expected Response**: 201 Created
```json
{
  "Id": "generated-guid",
  "HotelId": "hotel-guid",
  "RoomType": "Deluxe Suite",
  "PricePerNight": 250.00,
  "Capacity": 2,
  "IsAvailable": true,
  "CreatedAt": "2024-01-15T10:30:00Z",
  "UpdatedAt": null,
  "IsDeleted": false,
  "DeletedAt": null
}
```

**Save the Room Id** for next steps!

---

### Step 3: Get All Rooms (GET /api/rooms)

```bash
curl -X GET https://localhost:7291/api/rooms -k
```

**Expected Response**: 200 OK with array of rooms
```json
[
  {
    "Id": "room-guid",
    "HotelId": "hotel-guid",
    "RoomType": "Deluxe Suite",
    "PricePerNight": 250.00,
    "Capacity": 2,
    "IsAvailable": true,
    "Hotel": {
      "Id": "hotel-guid",
      "Name": "Grand Plaza Hotel",
      "Location": "New York, USA"
    },
    "CreatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Step 4: Get Room by ID (GET /api/rooms/{id})

```bash
# Replace {ROOM_ID} with actual room ID
curl -X GET https://localhost:7291/api/rooms/{ROOM_ID} -k
```

**Expected Response**: 200 OK with room details including Hotel

---

### Step 5: Update Room (PUT /api/rooms/{id})

```bash
# Replace {ROOM_ID} and {HOTEL_ID} with actual IDs
curl -X PUT https://localhost:7291/api/rooms/{ROOM_ID} \
  -H "Content-Type: application/json" \
  -k \
  -d "{
    \"HotelId\": \"{HOTEL_ID}\",
    \"RoomType\": \"Presidential Suite\",
    \"PricePerNight\": 500.00,
    \"Capacity\": 4,
    \"IsAvailable\": false
  }"
```

**Expected Response**: 204 No Content

---

### Step 6: Verify Update

```bash
curl -X GET https://localhost:7291/api/rooms/{ROOM_ID} -k
```

**Expected**: Room should show updated values

---

### Step 7: Delete Room (DELETE /api/rooms/{id})

```bash
# Replace {ROOM_ID} with actual room ID
curl -X DELETE https://localhost:7291/api/rooms/{ROOM_ID} -k
```

**Expected Response**: 204 No Content

---

### Step 8: Verify Soft Delete

```bash
curl -X GET https://localhost:7291/api/rooms/{ROOM_ID} -k
```

**Expected Response**: 404 Not Found (room is soft deleted)

```bash
curl -X GET https://localhost:7291/api/rooms -k
```

**Expected**: Deleted room should NOT appear in the list

---

## Validation Tests

### Test 1: Invalid PricePerNight (should fail)
```bash
curl -X POST https://localhost:7291/api/rooms \
  -H "Content-Type: application/json" \
  -k \
  -d "{
    \"HotelId\": \"{HOTEL_ID}\",
    \"RoomType\": \"Standard\",
    \"PricePerNight\": -50,
    \"Capacity\": 2
  }"
```

**Expected**: 400 Bad Request
```json
{ "Message": "PricePerNight must be greater than 0" }
```

---

### Test 2: Invalid Capacity (should fail)
```bash
curl -X POST https://localhost:7291/api/rooms \
  -H "Content-Type: application/json" \
  -k \
  -d "{
    \"HotelId\": \"{HOTEL_ID}\",
    \"RoomType\": \"Standard\",
    \"PricePerNight\": 100,
    \"Capacity\": 0
  }"
```

**Expected**: 400 Bad Request
```json
{ "Message": "Capacity must be greater than 0" }
```

---

### Test 3: Non-existent Hotel (should fail)
```bash
curl -X POST https://localhost:7291/api/rooms \
  -H "Content-Type: application/json" \
  -k \
  -d "{
    \"HotelId\": \"00000000-0000-0000-0000-000000000000\",
    \"RoomType\": \"Standard\",
    \"PricePerNight\": 100,
    \"Capacity\": 2
  }"
```

**Expected**: 404 Not Found
```json
{ "Message": "Hotel with ID 00000000-0000-0000-0000-000000000000 not found" }
```

---

### Test 4: Empty RoomType (should fail)
```bash
curl -X POST https://localhost:7291/api/rooms \
  -H "Content-Type: application/json" \
  -k \
  -d "{
    \"HotelId\": \"{HOTEL_ID}\",
    \"RoomType\": \"\",
    \"PricePerNight\": 100,
    \"Capacity\": 2
  }"
```

**Expected**: 400 Bad Request
```json
{ "Message": "RoomType is required" }
```

---

## PowerShell Commands (Windows)

### Create Room
```powershell
$hotelId = "your-hotel-guid-here"
$body = @{
    HotelId = $hotelId
    RoomType = "Deluxe Suite"
    PricePerNight = 250.00
    Capacity = 2
    IsAvailable = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:7291/api/rooms" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -SkipCertificateCheck
```

### Get All Rooms
```powershell
Invoke-RestMethod -Uri "https://localhost:7291/api/rooms" `
    -Method Get `
    -SkipCertificateCheck
```

### Get Room by ID
```powershell
$roomId = "your-room-guid-here"
Invoke-RestMethod -Uri "https://localhost:7291/api/rooms/$roomId" `
    -Method Get `
    -SkipCertificateCheck
```

### Update Room
```powershell
$roomId = "your-room-guid-here"
$hotelId = "your-hotel-guid-here"
$body = @{
    HotelId = $hotelId
    RoomType = "Presidential Suite"
    PricePerNight = 500.00
    Capacity = 4
    IsAvailable = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:7291/api/rooms/$roomId" `
    -Method Put `
    -Body $body `
    -ContentType "application/json" `
    -SkipCertificateCheck
```

### Delete Room
```powershell
$roomId = "your-room-guid-here"
Invoke-RestMethod -Uri "https://localhost:7291/api/rooms/$roomId" `
    -Method Delete `
    -SkipCertificateCheck
```

---

## Using Swagger UI (Recommended)

1. Navigate to: `https://localhost:7291/swagger`
2. Accept the self-signed certificate warning
3. Find the "Room" endpoints section
4. Click "Try it out" on any endpoint
5. Fill in the request body/parameters
6. Click "Execute"
7. View the response

**Advantages**:
- Visual interface
- Auto-generated request examples
- Response schema documentation
- No need to remember curl syntax

---

## Testing Checklist

- [ ] Create a hotel first (prerequisite)
- [ ] Create a room successfully
- [ ] Get all rooms (verify room appears)
- [ ] Get room by ID (verify details)
- [ ] Update room (change price, type, availability)
- [ ] Verify update worked
- [ ] Delete room (soft delete)
- [ ] Verify room doesn't appear in GET all
- [ ] Verify room returns 404 on GET by ID
- [ ] Test validation: negative price
- [ ] Test validation: zero capacity
- [ ] Test validation: non-existent hotel
- [ ] Test validation: empty room type

---

## Expected Log Output

When testing, you should see logs like:

```
[INF] Attempting to create room: { RoomType = "Deluxe Suite", HotelId = "...", PricePerNight = 250 }
[INF] Generated new GUID for room: 3fa85f64-5717-4562-b3fc-2c963f66afa6
[INF] Room created successfully with ID 3fa85f64-5717-4562-b3fc-2c963f66afa6
[INF] Retrieving all rooms
[INF] Retrieved 1 rooms
[INF] Retrieving room with ID 3fa85f64-5717-4562-b3fc-2c963f66afa6
[INF] Room with ID 3fa85f64-5717-4562-b3fc-2c963f66afa6 retrieved successfully
[INF] Attempting to update room with ID 3fa85f64-5717-4562-b3fc-2c963f66afa6
[INF] Room with ID 3fa85f64-5717-4562-b3fc-2c963f66afa6 updated successfully
[INF] Attempting to delete room with ID 3fa85f64-5717-4562-b3fc-2c963f66afa6
[INF] Room with ID 3fa85f64-5717-4562-b3fc-2c963f66afa6 soft deleted successfully
```

---

## Troubleshooting

### Issue: SSL Certificate Error
**Solution**: Add `-k` flag to curl or `-SkipCertificateCheck` to PowerShell

### Issue: Connection Refused
**Solution**: Ensure API is running with `dotnet run`

### Issue: 404 on all endpoints
**Solution**: Check the API is running on port 7291

### Issue: 500 Internal Server Error
**Solution**: Check the logs in `src/HotelBooking.API/logs/` folder

### Issue: Database Error
**Solution**: Ensure database is created and migrations are applied
```bash
cd src/HotelBooking.Infrastructure
dotnet ef database update --startup-project ../HotelBooking.API
```

---

## Quick Complete Test Script (PowerShell)

```powershell
# 1. Create Hotel
$hotelBody = @{
    Name = "Test Hotel"
    Location = "Test City"
    Description = "Test Description"
    Rating = 4.5
} | ConvertTo-Json

$hotel = Invoke-RestMethod -Uri "https://localhost:7291/api/hotels" `
    -Method Post -Body $hotelBody -ContentType "application/json" -SkipCertificateCheck

Write-Host "Created Hotel: $($hotel.Id)"

# 2. Create Room
$roomBody = @{
    HotelId = $hotel.Id
    RoomType = "Deluxe"
    PricePerNight = 200
    Capacity = 2
    IsAvailable = $true
} | ConvertTo-Json

$room = Invoke-RestMethod -Uri "https://localhost:7291/api/rooms" `
    -Method Post -Body $roomBody -ContentType "application/json" -SkipCertificateCheck

Write-Host "Created Room: $($room.Id)"

# 3. Get All Rooms
$rooms = Invoke-RestMethod -Uri "https://localhost:7291/api/rooms" `
    -Method Get -SkipCertificateCheck

Write-Host "Total Rooms: $($rooms.Count)"

# 4. Get Room by ID
$roomDetail = Invoke-RestMethod -Uri "https://localhost:7291/api/rooms/$($room.Id)" `
    -Method Get -SkipCertificateCheck

Write-Host "Room Type: $($roomDetail.RoomType)"

# 5. Update Room
$updateBody = @{
    HotelId = $hotel.Id
    RoomType = "Suite"
    PricePerNight = 300
    Capacity = 3
    IsAvailable = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:7291/api/rooms/$($room.Id)" `
    -Method Put -Body $updateBody -ContentType "application/json" -SkipCertificateCheck

Write-Host "Room Updated"

# 6. Delete Room
Invoke-RestMethod -Uri "https://localhost:7291/api/rooms/$($room.Id)" `
    -Method Delete -SkipCertificateCheck

Write-Host "Room Deleted"

Write-Host "All tests completed successfully!"
```

Save as `test-room-api.ps1` and run with: `.\test-room-api.ps1`
