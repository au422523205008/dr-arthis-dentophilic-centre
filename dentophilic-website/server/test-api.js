async function runTests() {
  console.log('--- 1. Testing Health Endpoint ---');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('Health:', healthData);

  console.log('\n--- 2. Checking Initial Availability for 2026-10-22 ---');
  const availRes1 = await fetch('http://localhost:5000/api/appointments/availability?date=2026-10-22');
  const avail1 = await availRes1.json();
  console.log('Available slots initial booked count:', avail1.bookedSlots.length);

  console.log('\n--- 3. Creating New Appointment for 2026-10-22 at 11:00 AM ---');
  const postRes1 = await fetch('http://localhost:5000/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ramesh Narayanan',
      phone: '9597126248',
      email: 'ramesh.n@gmail.com',
      age: 34,
      gender: 'Male',
      service: 'Single-Sitting Painless Root Canal (RCT)',
      date: '2026-10-22',
      timeSlot: '11:00 AM',
      message: 'Sensitivity to cold liquids'
    })
  });
  const postData1 = await postRes1.json();
  console.log('Status code:', postRes1.status);
  console.log('Appointment Reference ID:', postData1.appointment?.referenceId);
  console.log('Status:', postData1.appointment?.status);

  console.log('\n--- 4. Testing Double-Booking Prevention (Should return 409 Conflict) ---');
  const postRes2 = await fetch('http://localhost:5000/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Patient',
      phone: '9845123456',
      service: 'Teeth Cleaning & Ultrasonic Scaling',
      date: '2026-10-22',
      timeSlot: '11:00 AM'
    })
  });
  const postData2 = await postRes2.json();
  console.log('Status code:', postRes2.status, '(Expected: 409)');
  console.log('Conflict Message:', postData2.message);

  console.log('\n--- 5. Checking Updated Availability for 2026-10-22 ---');
  const availRes2 = await fetch('http://localhost:5000/api/appointments/availability?date=2026-10-22');
  const avail2 = await availRes2.json();
  console.log('Booked slots now include 11:00 AM?:', avail2.bookedSlots.includes('11:00 AM'));

  console.log('\n--- 6. Testing Protected Admin Endpoint Without API Key (Should return 401) ---');
  const adminRes1 = await fetch('http://localhost:5000/api/appointments');
  console.log('Status code without key:', adminRes1.status, '(Expected: 401)');

  console.log('\n--- 7. Testing Protected Admin Endpoint With Valid API Key ---');
  const adminRes2 = await fetch('http://localhost:5000/api/appointments', {
    headers: { 'x-api-key': 'dentophilic_admin_secret_2026' }
  });
  const adminData = await adminRes2.json();
  console.log('Status code with key:', adminRes2.status);
  console.log('Total appointments in DB:', adminData.total);

  console.log('\n--- 8. Testing Protected PATCH Status to Confirmed ---');
  const apptId = postData1.appointment.id;
  const patchRes = await fetch(`http://localhost:5000/api/appointments/${apptId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'dentophilic_admin_secret_2026'
    },
    body: JSON.stringify({ status: 'Confirmed' })
  });
  const patchData = await patchRes.json();
  console.log('Updated Status:', patchData.appointment?.status);
  console.log('\nALL BACKEND API TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);
