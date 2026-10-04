import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';
import ScreenHeader from '../ScreenHeader';
import ThemedText from '../themed/ThemedText';
import ThemedButton from '../themed/ThemedButton';
import ThemedTextInput from '../themed/ThemedTextInput';
export default function AccountScreen() {
 const { user, logout, updateProfile } = useAuth();
 const params = useLocalSearchParams();
 const id = params.userId || user?.id;
 const own = id === user?.id;
 const router = useRouter();
 const { colors, themeMode, setThemeMode } = useTheme();
 const [name,setName] = useState('');
 const [reviews,setReviews] = useState([]);
 const [error,setError] = useState('');
 const [busy,setBusy] = useState(false);
 useEffect(() => {
  let active=true;
  if (!id || !supabase) return;
  Promise.all([supabase.from('profiles').select('full_name').eq('id',id).single(),
    supabase.from('ratings').select('id,score,comment,created_at').eq('provider_id',id).order('created_at',{ascending:false})])
  .then(([profile,ratings]) => { if (!active) return; if(profile.error || ratings.error) throw profile.error || ratings.error;
    setName(profile.data.full_name);setReviews(ratings.data || []); })
  .catch(e => { if(active) setError(e.message); });
  return () => {active=false;};
 },[id]);
 const save=async()=>{setBusy(true);setError('');try {
   await updateProfile({name:name.trim(),phone:user.phone || '',address:user.address || ''});
 }catch(e){setError(e.message);}finally{setBusy(false);}};
 return <SafeAreaView style={{flex:1,backgroundColor:colors.background}}>
  <ScreenHeader title={own ? 'My account':'Profile'} onBack={()=>router.canGoBack()?router.back():router.replace('/dashboard')} />
  <ScrollView contentContainerStyle={{padding:24,gap:20,width:'100%',maxWidth:760,alignSelf:'center'}}>
   {error ? <ThemedText tone="danger" accessibilityRole="alert">{error}</ThemedText>:null}
   <View style={{width:64,height:64,borderRadius:22,backgroundColor:colors.surfaceAlt,alignItems:'center',justifyContent:'center'}}><ThemedText style={{fontSize:26,fontWeight:'700',color:colors.link}}>{name.trim().slice(0,1).toUpperCase() || '?'}</ThemedText></View>
   {own ? <><ThemedText style={{fontSize:22,fontWeight:'700'}}>Profile details</ThemedText><ThemedTextInput accessibilityLabel="Name" value={name} onChangeText={setName} maxLength={100} style={{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:12}} />
    <ThemedText>{user?.email}</ThemedText><ThemedButton title="Save name" disabled={busy || !name.trim()} onPress={save} />
    <ThemedButton title="Transaction history" variant="secondary" onPress={()=>router.push('/transactions')} />
    <ThemedText style={{fontWeight:'700',marginTop:12}}>Appearance</ThemedText>
    <View style={{flexDirection:'row',gap:8}}>{['light','dark','system'].map(mode=><ThemedButton key={mode} title={mode[0].toUpperCase()+mode.slice(1)} variant={themeMode===mode?'primary':'secondary'} onPress={()=>setThemeMode(mode).catch(e=>setError(e.message))} style={{flex:1}} />)}</View>
    <ThemedButton title="Sign out" variant="secondary" onPress={async()=>{try {await logout();router.replace('/');}catch(e){setError(e.message);}}} />
   </> : <ThemedText style={{fontSize:24,fontWeight:'700'}}>{name}</ThemedText>}
   <ThemedText style={{fontSize:20,fontWeight:'700'}}>Reviews received</ThemedText>
   <ThemedText>{reviews.length ? `${(reviews.reduce((sum,r)=>sum+r.score,0)/reviews.length).toFixed(1)} / 5 (${reviews.length} reviews)`:'No reviews yet'}</ThemedText>
   {reviews.map(r=><View key={r.id} style={{padding:16,gap:8,backgroundColor:colors.card,borderRadius:12}}>
     <ThemedText>{r.score} / 5 - {new Date(r.created_at).toLocaleDateString()}</ThemedText><ThemedText>{r.comment || 'No written review'}</ThemedText>
   </View>)}
  </ScrollView>
 </SafeAreaView>;
}
