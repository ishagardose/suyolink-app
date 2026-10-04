// Scheduled worker. PUSH_WORKER_SECRET stays in server secrets, never EXPO_PUBLIC_*.
import { createClient } from 'npm:@supabase/supabase-js@2';
Deno.serve(async request => {
 const secret=Deno.env.get('PUSH_WORKER_SECRET');
 if(!secret || request.headers.get('Authorization')!==`Bearer ${secret}`) return new Response('Unauthorized',{status:401});
 if(request.method!=='POST') return new Response('Method not allowed',{status:405});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const headers:Record<string,string>={'Content-Type':'application/json'};
 const accessToken=Deno.env.get('EXPO_ACCESS_TOKEN');if(accessToken) headers.Authorization=`Bearer ${accessToken}`;
 const check=({error}: {error:unknown})=>{if(error) throw error;};
 try {
  // Check receipts from earlier tickets; acceptance by Expo is not proof of delivery.
  const receipts=await db.from('push_outbox').select('id,token,ticket_id').not('ticket_id','is',null).lt('sent_at',new Date(Date.now()-15*60000).toISOString()).limit(100);
  check(receipts);
  if(receipts.data?.length){
   const response=await fetch('https://exp.host/--/api/v2/push/getReceipts',{method:'POST',headers,body:JSON.stringify({ids:receipts.data.map(r=>r.ticket_id)})});
   if(!response.ok) throw new Error('Push receipt service unavailable');
   const payload=await response.json();
   for(const job of receipts.data){const receipt=payload.data?.[job.ticket_id];if(!receipt) continue;
    if(receipt.details?.error==='DeviceNotRegistered'){check(await db.from('push_tokens').delete().eq('token',job.token));}
    else check(await db.from('push_outbox').update({ticket_id:null,last_error:receipt.status==='error'?(receipt.message || 'Delivery failed'):null}).eq('id',job.id));
   }
  }
  const claimed=await db.rpc('claim_push_jobs');check(claimed);
  let accepted=0;
  for(const job of claimed.data || []){
   try{
    // Re-check ownership immediately before send, in case a device changed accounts.
    const owner=await db.from('push_tokens').select('user_id').eq('token',job.token).maybeSingle();check(owner);
    if(owner.data?.user_id!==job.recipient_id){check(await db.from('push_outbox').delete().eq('id',job.id));continue;}
    const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers,body:JSON.stringify({to:job.token,title:'SuyoLink',body:'You have a task update. Open SuyoLink to view it.',data:{requestId:job.request_id},channelId:'default'})});
    if(!response.ok) throw new Error(`Push service HTTP ${response.status}`);
    const payload=await response.json();const ticket=payload.data;
    if(ticket?.details?.error==='DeviceNotRegistered'){check(await db.from('push_tokens').delete().eq('token',job.token));continue;}
    if(ticket?.status!=='ok') throw new Error(ticket?.message || 'Push service rejected notification');
    check(await db.from('push_outbox').update({sent_at:new Date().toISOString(),ticket_id:ticket.id,last_error:null}).eq('id',job.id));accepted++;
   }catch(e){check(await db.from('push_outbox').update({last_error:String(e).slice(0,500)}).eq('id',job.id));}
  }
  return Response.json({accepted});
 }catch{ return Response.json({error:'Push worker failed; inspect the queue and retry.'},{status:500}); }
});
