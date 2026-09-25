const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://revznnwmrrwdlbpdjfpr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldnpubndtcnJ3ZGxicGRqZnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDI3NTIsImV4cCI6MjEwNTc3ODc1Mn0.k3eXzGYvIk9coVu0FTvV1G2BDvcSqxUqgidiZWBRaIc');

async function run() {
  const email = `test-${Date.now()}@test.com`;
  console.log('Signing up with', email);
  const { data: { session }, error: signUpError } = await supabase.auth.signUp({ email, password: 'password123' });
  
  if (signUpError) {
    console.error('SignUp Error:', signUpError);
    return;
  }
  
  if (!session) {
    console.error('No session returned! Confirm Email might still be enabled.');
    return;
  }

  console.log('User created:', session.user.id);
  
  console.log('Attempting to insert workout...');
  const { data, error } = await supabase.from('workouts').insert([{ 
    name: 'Test Workout', 
    user_id: session.user.id 
  }]);
  
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success!', data);
  }
}

run();
