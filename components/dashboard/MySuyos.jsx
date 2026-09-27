import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSuyos } from '../../context/SuyoContext';
import ThemedButton from '../themed/ThemedButton';
import ThemedText from '../themed/ThemedText';
import TaskCard from '../cards/TaskCard';
export default function MySuyos({ history = false }) {
  const { user } = useAuth();
  const { requests, applications } = useSuyos();
  const [role, setRole] = useState('posted');
  const [status, setStatus] = useState('all');
  const mine = applications.filter(item => item.applicant_id === user.id);
  const selected = requests.filter(item => history
    ? (item.requesterId === user.id || item.providerId === user.id) && ['completed', 'cancelled'].includes(item.status)
    : (role === 'posted' ? item.requesterId === user.id : role === 'assigned' ? item.providerId === user.id : mine.some(app => app.request_id === item.id))
      && (status === 'all' || (status === 'active' ? !['completed', 'cancelled'].includes(item.status) : item.status === status)));
  return <View style={{ gap: 12 }}>
    <ThemedText style={{ fontSize: 22, fontWeight: '800' }}>{history ? 'Activity & history' : 'My Suyos'}</ThemedText>
    {!history ? <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[['posted', 'Posted'], ['applied', 'Applications'], ['assigned', 'Assigned to me']].map(([key, label]) =>
        <ThemedButton key={key} title={label} variant={role === key ? 'primary' : 'secondary'} onPress={() => setRole(key)} />)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[['all', 'All tasks'], ['active', 'Active tasks'], ['completed', 'Completed tasks'], ['cancelled', 'Cancelled tasks']].map(([key, label]) =>
        <ThemedButton key={key} title={label} variant={status === key ? 'primary' : 'secondary'} onPress={() => setStatus(key)} />)}</View>
    </> : null}
    {!selected.length ? <ThemedText>{history ? 'No completed or cancelled tasks yet.' : 'No tasks in this view yet.'}</ThemedText> : selected.map(item => <View key={item.id} style={{ gap: 6 }}>
      {!history && role === 'applied' ? <ThemedText>Application: {mine.find(app => app.request_id === item.id)?.status}</ThemedText> : null}
      <TaskCard suyo={item} />
    </View>)}
  </View>;
}
