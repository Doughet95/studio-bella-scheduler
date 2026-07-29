const { createClient } = require('@supabase/supabase-js');

async function run() {
  try {
    const supabase = createClient('https://simkzfsdidsjkvetxyel.supabase.co ', 'dummy');
    await supabase.from('transactions').insert([{}]).select();
    console.log("Done");
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
