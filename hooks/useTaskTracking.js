import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { getRequestDetails } from '../data/suyoApi';

export default function useTaskTracking(requestId, userId) {
 const [task,setTask]=useState(null);
 const [position,setPosition]=useState(null);
 const [consent,setConsent]=useState(null);
 const [sharing,setSharing]=useState(false);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const watcher=useRef(null);
 const generation=useRef(0);
 const sharingRef=useRef(false);
 const mounted=useRef(false);
 const operation=useRef(false);
 const refresh=useCallback(async()=>{
  if(!requestId || !supabase) return;
  const current=generation.current;
  try {
   const next=await getRequestDetails(requestId);
   if(!next) throw new Error('Task unavailable.');
   // Public viewers can see the approximate task map, never tracking data.
   let point=null, permission=null;
   if(next.requesterId===userId || next.providerId===userId){
    const [loc,con]=await Promise.all([
     supabase.from('live_locations').select('*').eq('request_id',requestId).maybeSingle(),
     supabase.from('tracking_consents').select('*').eq('request_id',requestId).maybeSingle()]);
    if(loc.error || con.error) throw loc.error || con.error;
    point=loc.data;permission=con.data;
   }
   if(!mounted.current || current!==generation.current) return;
   setTask(next);setPosition(point);setConsent(permission);
   if(!['assigned','in_progress'].includes(next.status) || permission?.revoked_at){
    watcher.current?.remove();watcher.current=null;sharingRef.current=false;setSharing(false);
   }
  }catch(e){if(mounted.current && current===generation.current) setError(e.message);}
 },[requestId,userId]);
 const stop=useCallback(async()=>{
  ++generation.current;watcher.current?.remove();watcher.current=null;sharingRef.current=false;
  if(mounted.current){setSharing(false);setPosition(null);}
  const result=await supabase.rpc('set_tracking_consent',{p_request_id:requestId,p_share:false});
  if(result.error && mounted.current) setError(result.error.message);
  await refresh();
 },[requestId,refresh]);
 useEffect(()=>{
  mounted.current=true;refresh();
  const timer=setInterval(refresh,6000);
  const channel=supabase?.channel(`tracking-${requestId}-${userId}`)
   .on('postgres_changes',{event:'*',schema:'public',table:'live_locations',filter:`request_id=eq.${requestId}`},refresh)
   .on('postgres_changes',{event:'*',schema:'public',table:'tracking_consents',filter:`request_id=eq.${requestId}`},refresh).subscribe();
  const appState=AppState.addEventListener('change',state=>{if(state==='background' || (state==='inactive' && sharingRef.current)){++generation.current;if(sharingRef.current) stop();}});
  return ()=>{
   mounted.current=false;++generation.current;clearInterval(timer);appState.remove();
   watcher.current?.remove();watcher.current=null;
   if(sharingRef.current) supabase.rpc('set_tracking_consent',{p_request_id:requestId,p_share:false}).then(()=>{});
   sharingRef.current=false;if(channel) supabase.removeChannel(channel);
  };
 },[requestId,userId,refresh,stop]);
 const start=async()=>{
  if(operation.current || sharingRef.current) return;
  operation.current=true;setBusy(true);setError('');
  const current=generation.current;
  try{
   const permission=await Location.requestForegroundPermissionsAsync();
   if(!permission.granted) throw new Error('Allow location access in settings to share your position.');
   if(!mounted.current || current!==generation.current) return;
   const result=await supabase.rpc('set_tracking_consent',{p_request_id:requestId,p_share:true});
   if(result.error) throw result.error;
   if(!mounted.current || current!==generation.current){await supabase.rpc('set_tracking_consent',{p_request_id:requestId,p_share:false});return;}
   sharingRef.current=true;
   let uploading=false,lastSent=0;
   const subscription=await Location.watchPositionAsync({accuracy:Location.Accuracy.High,timeInterval:5000,distanceInterval:0},async location=>{
    if(uploading || Date.now()-lastSent<4000 || !sharingRef.current || current!==generation.current) return;
    uploading=true;lastSent=Date.now();
    try{
     const c=location.coords;
     const update=await supabase.rpc('update_task_location',{p_request_id:requestId,p_latitude:c.latitude,p_longitude:c.longitude,
      p_accuracy:c.accuracy>=0?c.accuracy:null,p_speed:c.speed>=0?c.speed:null});
     if(update.error) throw update.error;
     if(mounted.current && current===generation.current){setPosition(update.data);setError('');}
    }catch(e){if(mounted.current && current===generation.current) setError(e.message);}
    finally{uploading=false;}
   },message=>{if(mounted.current) setError(message);});
   if(!mounted.current || current!==generation.current){subscription.remove();return;}
   watcher.current=subscription;setSharing(true);await refresh();
  }catch(e){if(mounted.current) setError(e.message);if(sharingRef.current) await stop();}
  finally{operation.current=false;if(mounted.current) setBusy(false);}
 };
 return {task,position,consent,sharing,error,busy,start,stop,refresh};
}
