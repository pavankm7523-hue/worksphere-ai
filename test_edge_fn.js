import { createClient } from '@supabase/supabase-js';

const url = 'https://gseevsxscedmczzxjtan.supabase.co';
const anonKey = 'sb_publishable_x3PMoZsW_HavNhmH-km0aQ__JY5fm7k';
// Service role key used only for storage upload in this test script
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZWV2c3hzY2VkbWN6enhqdGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU4NzM5NywiZXhwIjoyMDk5MTYzMzk3fQ.De4rHiFjWRHzFoCmQuS_n_3pn83xgh3mD1oiE8xtjTk';
const supabase = createClient(url, anonKey);
const supabaseAdmin = createClient(url, serviceKey);

// A minimal valid single-page PDF as a buffer (PDF 1.4 spec compliant)
const minimalPdfB64 = 
  'JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKFNhbXBsZSBSZXN1bWUpCi9BdXRob3IgKEpvaG4gRG9lKQo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFs0IDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA1IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNiAwIFIKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9MZW5ndGggMjEwCj4+CnN0cmVhbQpCVAovRjEgMTggVGYKNTAgNzUwIFRkCihKb2huIERvZSAtIFNlbmlvciBGcm9udGVuZCBFbmdpbmVlcikgVGoKL0YxIDEyIFRmCjUwIDcyMCBUZAooRW1haWw6IGpvaG4uZG9lQGV4YW1wbGUuY29tKSBUagovRjEgMTIgVGYKNTAgNjkwIFRkCihFeHBlcmllbmNlOiA4IHllYXJzIG9mIFJlYWN0LCBUeXBlU2NyaXB0LCBDU1MgYW5kIHdlYiBhY2Nlc3NpYmlsaXR5KSBUagovRjEgMTIgVGYKNTAgNjYwIFRkCihTa2lsbHM6IFJlYWN0LCBUeXBlU2NyaXB0LCBDU1MsIFdlYnBhY2ssIFZpdGUsIEdpdEh1YiBBY3Rpb25zKSBUagpFVApMZW5ndGggMjEwCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDExNyAwMDAwMCBuIAowMDAwMDAwMjE2IDAwMDAwIG4gCjAwMDAwMDAzOTQgMDAwMDAgbiAKMDAwMDAwMDQ3MyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDcKL1Jvb3QgMiAwIFIKL0luZm8gMSAwIFIKPj4Kc3RhcnR4cmVmCjczMQolJUVPRgo=';

const pdfBytes = Buffer.from(minimalPdfB64, 'base64');

async function testEdgeFunction() {
  console.log('=== EDGE FUNCTION LIVE TEST ===');

  // 1. Login as HR
  console.log('\n1. Logging in as HR manager...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testmanager1@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('HR login failed:', authError.message);
    return;
  }
  console.log('Logged in as:', authData.user.email);

  // 2. Upload test PDF to storage (using admin client to bypass RLS in test)
  console.log('\n2. Uploading test resume PDF to "resumes" bucket...');
  const filePath = `test_resume_${Date.now()}.pdf`;
  const { data: storageData, error: storageError } = await supabaseAdmin.storage
    .from('resumes')
    .upload(filePath, pdfBytes, { contentType: 'application/pdf' });

  if (storageError) {
    console.error('Storage upload failed:', storageError.message);
    return;
  }
  console.log('Uploaded to path:', storageData.path);

  // 3. Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('resumes')
    .getPublicUrl(storageData.path);
  console.log('Public URL:', publicUrl);

  // 4. Invoke the Edge Function
  console.log('\n3. Calling analyze-resume Edge Function...');
  const { data: analysis, error: fnError } = await supabase.functions.invoke('analyze-resume', {
    body: {
      resumeUrl: publicUrl,
      jobTitle: 'Senior Frontend Engineer',
      requirements: 'React, TypeScript, CSS, performance optimization, accessibility'
    }
  });

  if (fnError) {
    console.error('Edge Function error:', fnError);
    return;
  }

  if (analysis.error) {
    console.error('Edge Function returned error:', analysis.error);
    return;
  }

  console.log('\n=== AI ANALYSIS RESULT ===');
  console.log(JSON.stringify(analysis, null, 2));

  // 5. Verify key fields
  const required = ['candidate_name', 'score', 'summary', 'matched_skills', 'missing_skills'];
  const missing = required.filter(k => !(k in analysis));
  if (missing.length > 0) {
    console.error('MISSING KEYS in response:', missing);
  } else {
    console.log('\n✓ All required fields present!');
    console.log(`✓ Candidate: ${analysis.candidate_name}`);
    console.log(`✓ Score: ${analysis.score}/100`);
    console.log(`✓ Matched skills: ${analysis.matched_skills.join(', ')}`);
    console.log(`✓ Missing skills: ${analysis.missing_skills.join(', ')}`);
  }

  await supabase.auth.signOut();
}

testEdgeFunction();
