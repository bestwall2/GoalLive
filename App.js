import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const API = 'https://worldcup26.ir/get/soccer';
const C = { bg:'#080D18', panel:'#111A2A', panel2:'#172337', line:'#243149', text:'#F4F7FC', muted:'#8D9BB2', green:'#21D18B', red:'#FF5364', blue:'#4B8DFF', yellow:'#FFC857' };

async function apiGet(path) {
  const response = await fetch(API + path, { headers: { Accept: 'application/json' } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Football API error (${response.status})`);
  return body;
}
const safe = value => value == null || value === '' ? '—' : String(value);
const teamOf = competitor => competitor?.team || {};
function eventToMatch(event, league) {
  const competition = event?.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  const home = competitors.find(x => x.homeAway === 'home') || competitors[0] || {};
  const away = competitors.find(x => x.homeAway === 'away') || competitors[1] || {};
  const status = event?.status || competition.status || {};
  const state = status?.type?.state || 'unknown';
  const type = status?.type || {};
  const homeTeam = teamOf(home), awayTeam = teamOf(away);
  return {
    id: String(event.id || event.uid || ''),
    leagueSlug: league?.slug || '',
    league: league?.name || league?.abbreviation || 'Football',
    country: league?.country || '',
    date: event.date || competition.date || '',
    status: state,
    statusLabel: type.shortDetail || type.detail || type.description || type.name || state.toUpperCase(),
    minute: status.displayClock || '',
    home: homeTeam.displayName || homeTeam.name || 'Home',
    away: awayTeam.displayName || awayTeam.name || 'Away',
    homeLogo: homeTeam.logo || '',
    awayLogo: awayTeam.logo || '',
    homeColor: homeTeam.color || '#D94A43',
    awayColor: awayTeam.color || '#2865C7',
    homeScore: home.score == null ? null : Number(home.score),
    awayScore: away.score == null ? null : Number(away.score),
    venue: competition.venue?.fullName || event.venue?.displayName || '',
    raw: event
  };
}
function TeamBadge({ name, logo, color }) {
  return logo
    ? <Image source={{ uri: logo }} style={s.teamLogo} resizeMode="contain" />
    : <View style={[s.teamLogoFallback, { backgroundColor: color || C.panel2 }]}><Text style={s.teamInitial}>{(name || '?').slice(0,1)}</Text></View>;
}
function Header({ subtitle, right }) {
  return <View style={s.header}>
    <View><Text style={s.brand}>GOAL<Text style={{color:C.green}}>LIVE</Text></Text><Text style={s.headerSub}>{subtitle}</Text></View>
    {right || <View style={s.headerIcon}><MaterialCommunityIcons name="soccer" size={22} color={C.green}/></View>}
  </View>;
}
function State({ loading, error, empty, onRetry }) {
  if (loading) return <View style={s.state}><ActivityIndicator color={C.green} size="large"/><Text style={s.muted}>Loading football data…</Text></View>;
  if (error) return <View style={s.state}><Ionicons name="cloud-offline-outline" size={30} color={C.red}/><Text style={s.stateTitle}>Couldn't load data</Text><Text style={s.muted}>{error}</Text><TouchableOpacity onPress={onRetry} style={s.retry}><Text style={s.retryText}>Try again</Text></TouchableOpacity></View>;
  if (empty) return <View style={s.state}><MaterialCommunityIcons name="soccer" size={34} color={C.muted}/><Text style={s.stateTitle}>No matches found</Text><Text style={s.muted}>There is no stored data for this competition or date yet.</Text></View>;
  return null;
}
function MatchCard({ match, onPress }) {
  const live = match.status === 'in';
  const finished = match.status === 'post';
  return <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={s.matchCard}>
    <View style={s.matchTop}><Text style={s.leagueText}>{match.league}{match.country ? ' · '+match.country : ''}</Text>
      <View style={[s.statusPill, live && s.livePill, finished && s.ftPill]}>{live && <View style={s.liveDot}/>}<Text style={[s.statusText, live && {color:C.red}]}>{live ? (match.minute || 'LIVE') : finished ? 'FULL TIME' : (match.statusLabel || 'SCHEDULED')}</Text></View>
    </View>
    <View style={s.matchTeams}>
      <View style={s.teamSide}><TeamBadge name={match.home} logo={match.homeLogo} color={match.homeColor}/><Text numberOfLines={1} style={s.teamName}>{match.home}</Text></View>
      <View style={s.scoreBox}><Text style={s.score}>{match.homeScore == null ? '—' : match.homeScore}<Text style={s.scoreSep}> : </Text>{match.awayScore == null ? '—' : match.awayScore}</Text><Text style={s.scoreCaption}>{live ? 'LIVE NOW' : finished ? 'RESULT' : (match.date ? new Date(match.date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'UPCOMING')}</Text></View>
      <View style={[s.teamSide,{alignItems:'flex-end'}]}><TeamBadge name={match.away} logo={match.awayLogo} color={match.awayColor}/><Text numberOfLines={1} style={s.teamName}>{match.away}</Text></View>
    </View>
    <View style={s.cardFooter}><Text style={s.footerText}>{match.venue || (match.date ? new Date(match.date).toLocaleDateString() : 'Match')}</Text><Text style={s.details}>Match centre <Ionicons name="chevron-forward" size={12}/></Text></View>
  </TouchableOpacity>;
}
function LeaguePicker({ leagues, selected, onSelect }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
    {leagues.map(l => <TouchableOpacity key={l.slug} onPress={() => onSelect(l)} style={[s.chip, selected?.slug === l.slug && s.chipActive]}><Text style={[s.chipText, selected?.slug === l.slug && s.chipTextActive]}>{l.name}</Text></TouchableOpacity>)}
  </ScrollView>;
}
function Home({ leagues, league, onLeague, matches, loading, error, refresh, onMatch }) {
  const live = matches.filter(m => m.status === 'in');
  return <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.green}/>}>
    <Header subtitle="LIVE SCORES · FIXTURES · RESULTS"/>
    <View style={s.hero}><Text style={s.heroEyebrow}>THE BEAUTIFUL GAME</Text><Text style={s.heroTitle}>Every match.{'\n'}Every moment.</Text><Text style={s.heroDesc}>Real football data, refreshed from the live-score service.</Text><View style={s.heroBottom}><View style={s.heroLive}><View style={s.liveDot}/><Text style={s.heroLiveText}>{live.length} LIVE MATCHES IN THIS LEAGUE</Text></View><MaterialCommunityIcons name="soccer" size={48} color="#FFFFFF"/></View></View>
    <Text style={s.sectionTitle}>Competitions</Text><LeaguePicker leagues={leagues} selected={league} onSelect={onLeague}/>
    <View style={s.sectionHead}><Text style={s.sectionTitle}>Matches</Text><Text style={s.smallMuted}>{matches.length} stored events</Text></View>
    <State loading={loading && !matches.length} error={error && !matches.length ? error : null} empty={!loading && !error && !matches.length} onRetry={refresh}/>
    {matches.map(m => <MatchCard key={m.id} match={m} onPress={() => onMatch(m)}/>)}
    <Text style={s.disclaimer}>Data provided by livescoreFootball · Availability and freshness depend on its data sync.</Text>
  </ScrollView>;
}
function Fixtures({ leagues, league, onLeague, matches, loading, error, refresh, onMatch }) {
  const [filter, setFilter] = useState('all');
  const filtered = matches.filter(m => filter === 'all' || (filter === 'live' ? m.status === 'in' : filter === 'finished' ? m.status === 'post' : m.status === 'pre'));
  return <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.green}/>}>
    <Header subtitle="FIXTURES & RESULTS"/>
    <LeaguePicker leagues={leagues} selected={league} onSelect={onLeague}/>
    <View style={s.filterRow}>{[['all','All'],['live','Live'],['pre','Upcoming'],['finished','Results']].map(([id,label])=><TouchableOpacity key={id} onPress={()=>setFilter(id)} style={[s.filterChip,filter===id&&s.filterActive]}><Text style={[s.filterText,filter===id&&{color:C.text}]}>{label}</Text></TouchableOpacity>)}</View>
    <State loading={loading} error={error} empty={!loading && !error && !filtered.length} onRetry={refresh}/>
    {filtered.map(m=><MatchCard key={m.id} match={m} onPress={()=>onMatch(m)}/>)}
  </ScrollView>;
}
function Standings({ leagues, league, onLeague, standings, loading, error, refresh }) {
  return <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.green}/>}>
    <Header subtitle="LEAGUE TABLES"/><LeaguePicker leagues={leagues} selected={league} onSelect={onLeague}/>
    <State loading={loading} error={error} empty={!loading && !error && !standings.length} onRetry={refresh}/>
    {standings.map((group, index)=><View key={group.id || index} style={s.tableCard}>
      <Text style={s.tableTitle}>{group.name || 'Overall standings'}</Text>
      <View style={s.tableRow}><Text style={[s.tableMuted,{flex:1}]}>CLUB</Text><Text style={s.tableMuted}>P</Text><Text style={s.tableMuted}>W</Text><Text style={s.tableMuted}>D</Text><Text style={s.tableMuted}>L</Text><Text style={s.tableMuted}>PTS</Text></View>
      {(group.standings?.entries || []).map((entry, i)=>{
        const stats = entry.stats || [];
        const val = (...keys) => { const x=stats.find(v=>keys.includes(String(v.name||v.abbreviation||'').toLowerCase())); return x?.displayValue ?? x?.value ?? '—'; };
        const team = entry.team || {};
        return <View key={team.id || i} style={s.tableRow}><Text style={s.rank}>{entry.rank ?? i+1}</Text><View style={s.clubCell}>{team.logo ? <Image source={{uri:team.logo}} style={s.tableLogo}/> : null}<Text numberOfLines={1} style={s.clubName}>{team.displayName || team.name || 'Club'}</Text></View><Text style={s.tableNum}>{val('gamesplayed','played','gp','app')}</Text><Text style={s.tableNum}>{val('wins','w')}</Text><Text style={s.tableNum}>{val('ties','draws','d')}</Text><Text style={s.tableNum}>{val('losses','l')}</Text><Text style={[s.tableNum,{color:C.text,fontWeight:'800'}]}>{val('points','pts')}</Text></View>;
      })}
    </View>)}
  </ScrollView>;
}
function Leagues({ leagues, onSelect }) {
  return <ScrollView contentContainerStyle={s.page}><Header subtitle="AVAILABLE COMPETITIONS"/>{leagues.map(l=><TouchableOpacity key={l.slug} onPress={()=>onSelect(l)} style={s.leagueCard}>
    {l.logo ? <Image source={{uri:l.logo}} style={s.leagueLogo}/> : <View style={s.leagueLogoFallback}><MaterialCommunityIcons name="trophy-outline" color={C.green} size={22}/></View>}
    <View style={{flex:1}}><Text style={s.leagueName}>{l.name}</Text><Text style={s.footerText}>{l.country || 'International'} · {l.coverage?.matches || 0} matches · {l.coverage?.clubs || 0} clubs</Text></View><Ionicons name="chevron-forward" color={C.muted} size={18}/>
  </TouchableOpacity>)}</ScrollView>;
}
function MatchDetail({ match, onBack }) {
  const [summary,setSummary]=useState(null), [plays,setPlays]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sum, timeline] = await Promise.all([
        apiGet('/'+encodeURIComponent(match.leagueSlug)+'/events/'+encodeURIComponent(match.id)),
        apiGet('/'+encodeURIComponent(match.leagueSlug)+'/events/'+encodeURIComponent(match.id)+'/plays?important=true&limit=100').catch(()=>({items:[]}))
      ]);
      setSummary(sum); setPlays(timeline.items || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [match.id, match.leagueSlug]);
  useEffect(()=>{load();},[load]);
  const headerCompetition = summary?.header?.competitions?.[0];
  const competitors = headerCompetition?.competitors || [];
  const home = competitors.find(x=>x.homeAway==='home') || {};
  const away = competitors.find(x=>x.homeAway==='away') || {};
  const events = [...(summary?.keyEvents || []), ...plays].filter((v,i,a)=>a.findIndex(x=>(x.id||x.sourceEventId) === (v.id||v.sourceEventId))===i);
  return <ScrollView contentContainerStyle={s.page}>
    <TouchableOpacity onPress={onBack} style={s.back}><Ionicons name="arrow-back" size={20} color={C.text}/><Text style={s.backText}>Back</Text></TouchableOpacity>
    <Text style={s.detailLeague}>{match.league}</Text>
    <View style={s.detailScore}>
      <View style={s.detailTeamWrap}><TeamBadge name={match.home} logo={match.homeLogo} color={match.homeColor}/><Text style={s.detailTeam}>{match.home}</Text></View>
      <View style={{alignItems:'center'}}><Text style={s.bigScore}>{match.homeScore ?? '—'} : {match.awayScore ?? '—'}</Text><Text style={s.detailStatus}>{match.statusLabel}</Text></View>
      <View style={s.detailTeamWrap}><TeamBadge name={match.away} logo={match.awayLogo} color={match.awayColor}/><Text style={s.detailTeam}>{match.away}</Text></View>
    </View>
    {loading && <ActivityIndicator color={C.green}/>}
    {error && <Text style={s.errorText}>{error}</Text>}
    <View style={s.tableCard}><Text style={s.tableTitle}>Match events</Text>
      {!loading && !events.length && <Text style={s.muted}>No stored key events are available for this match.</Text>}
      {events.map((e,i)=><View key={e.id || i} style={s.eventRow}><View style={s.eventMinute}><Text style={s.eventMinuteText}>{e.clock?.displayValue || e.minute || e.period?.number || '•'}</Text></View><View style={{flex:1}}><Text style={s.eventTitle}>{e.text || e.type?.text || (e.scoringPlay ? 'Goal' : 'Match event')}</Text>{e.athletesInvolved?.length ? <Text style={s.muted}>{e.athletesInvolved.map(a=>a.displayName || a.name).filter(Boolean).join(', ')}</Text> : null}</View>{e.scoringPlay ? <Ionicons name="football" color={C.green} size={18}/> : e.yellowCard ? <View style={s.yellowCard}/> : e.redCard ? <View style={s.redCard}/> : null}</View>)}
    </View>
    {summary?.boxscore?.teams?.length ? <View style={s.tableCard}><Text style={s.tableTitle}>Team statistics</Text>{summary.boxscore.teams.map((team,i)=><View key={i} style={s.statsTeam}><Text style={s.eventTitle}>{team.team?.displayName || team.team?.name}</Text>{(team.statistics || []).map((stat,j)=><View key={j} style={s.statLine}><Text style={s.muted}>{stat.name}</Text><Text style={s.eventTitle}>{stat.displayValue}</Text></View>)}</View>)}</View> : null}
    {summary?.meta?.lastSyncedAt ? <Text style={s.disclaimer}>Last synced: {new Date(summary.meta.lastSyncedAt).toLocaleString()}</Text> : null}
  </ScrollView>;
}
const tabs=[{id:'Home',icon:'home-outline'},{id:'Fixtures',icon:'calendar-outline'},{id:'Tables',icon:'podium-outline'},{id:'Leagues',icon:'trophy-outline'}];
export default function App() {
  const [tab,setTab]=useState('Home'), [leagues,setLeagues]=useState([]), [league,setLeague]=useState(null);
  const [matches,setMatches]=useState([]), [standings,setStandings]=useState([]);
  const [selected,setSelected]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState(null);
  // Temporary runtime connectivity diagnostic: visible in the Metro/Expo logs.
  useEffect(() => {
    let active = true;
    fetch(API + '/meta', { headers: { Accept: 'application/json' } })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `API health check failed (${response.status})`);
        if (active) console.log('GOALLIVE API TEST: SUCCESS', data);
      })
      .catch(error => {
        if (active) console.log('GOALLIVE API ERROR:', error?.message || String(error));
      });
    return () => { active = false; };
  }, []);
  const loadLeagues = useCallback(async () => {
    const data=await apiGet('/leagues?kind=club&available=true');
    const list=data.leagues || []; setLeagues(list);
    setLeague(current => current && list.some(x=>x.slug===current.slug) ? current : (list.find(x=>x.slug==='eng.1') || list[0] || null));
    return list;
  }, []);
  const loadMatches = useCallback(async (chosen) => {
    if (!chosen?.slug) { setMatches([]); return; }
    const data=await apiGet('/'+encodeURIComponent(chosen.slug)+'/fixtures?status=all&page=1&limit=200');
    setMatches((data.events || []).map(event=>eventToMatch(event,chosen)).sort((a,b)=>new Date(a.date)-new Date(b.date)));
  }, []);
  const loadStandings = useCallback(async (chosen) => {
    if (!chosen?.slug) { setStandings([]); return; }
    const data=await apiGet('/'+encodeURIComponent(chosen.slug)+'/standings');
    setStandings(data.children || []);
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const list=leagues.length ? leagues : await loadLeagues();
      const chosen=league || list.find(x=>x.slug==='eng.1') || list[0];
      if (tab==='Tables') await loadStandings(chosen);
      else await loadMatches(chosen);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [leagues, league, tab, loadLeagues, loadMatches, loadStandings]);
  useEffect(()=>{ (async()=>{try{const list=await loadLeagues(); const chosen=list.find(x=>x.slug==='eng.1')||list[0]; if(chosen) await loadMatches(chosen); else setError('No competitions with stored data are currently available.');}catch(e){setError(e.message);}finally{setLoading(false);}})(); },[loadLeagues,loadMatches]);
  useEffect(()=>{if(!league)return; let active=true; setLoading(true); setError(null); const run=async()=>{try{if(tab==='Tables')await loadStandings(league);else if(tab==='Home'||tab==='Fixtures')await loadMatches(league);}catch(e){if(active)setError(e.message);}finally{if(active)setLoading(false);}}; run(); return ()=>{active=false;};},[league,tab,loadMatches,loadStandings]);
  useEffect(()=>{if(tab!=='Home'&&tab!=='Fixtures')return; const timer=setInterval(()=>{if(!selected)loadMatches(league).catch(()=>{});},15000);return()=>clearInterval(timer);},[tab,league,selected,loadMatches]);
  const content=useMemo(()=>{
    if(selected)return <MatchDetail match={selected} onBack={()=>setSelected(null)}/>;
    if(tab==='Fixtures')return <Fixtures leagues={leagues} league={league} onLeague={setLeague} matches={matches} loading={loading} error={error} refresh={refresh} onMatch={setSelected}/>;
    if(tab==='Tables')return <Standings leagues={leagues} league={league} onLeague={setLeague} standings={standings} loading={loading} error={error} refresh={refresh}/>;
    if(tab==='Leagues')return <Leagues leagues={leagues} onSelect={l=>{setLeague(l);setTab('Fixtures');}}/>;
    return <Home leagues={leagues} league={league} onLeague={setLeague} matches={matches} loading={loading} error={error} refresh={refresh} onMatch={setSelected}/>;
  },[selected,tab,leagues,league,matches,loading,error,standings,refresh]);
  return <SafeAreaView style={s.safe}><StatusBar barStyle="light-content" backgroundColor={C.bg}/><View style={s.container}>{content}</View>{!selected&&<View style={s.bottom}>{tabs.map(t=><TouchableOpacity key={t.id} onPress={()=>setTab(t.id)} style={s.navItem}><Ionicons name={t.icon} size={21} color={tab===t.id?C.green:C.muted}/><Text style={[s.navText,tab===t.id&&{color:C.green}]}>{t.id}</Text></TouchableOpacity>)}</View>}</SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},container:{flex:1},page:{paddingHorizontal:18,paddingTop:10,paddingBottom:28},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:22},brand:{fontSize:24,fontWeight:'900',letterSpacing:1.1,color:C.text},headerSub:{fontSize:9,color:C.muted,letterSpacing:1.6,marginTop:3,fontWeight:'700'},headerIcon:{width:42,height:42,borderRadius:14,backgroundColor:C.panel,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.line},
 hero:{backgroundColor:'#142B36',borderRadius:23,padding:20,overflow:'hidden',marginBottom:22,borderWidth:1,borderColor:'#235044'},heroEyebrow:{color:'#75E6B8',fontSize:10,fontWeight:'800',letterSpacing:2},heroTitle:{fontSize:32,lineHeight:36,color:C.text,fontWeight:'900',marginTop:13},heroDesc:{color:'#B7C9C8',fontSize:12,lineHeight:18,marginTop:9,maxWidth:250},heroBottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:18},heroLive:{flexDirection:'row',alignItems:'center',gap:8},heroLiveText:{fontSize:9,color:C.text,fontWeight:'800',letterSpacing:1.1},
 sectionTitle:{fontSize:19,fontWeight:'800',color:C.text,marginBottom:12},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10,marginBottom:13},smallMuted:{fontSize:10,color:C.muted},chips:{gap:8,paddingBottom:14},chip:{paddingHorizontal:14,paddingVertical:9,borderRadius:20,backgroundColor:C.panel,borderWidth:1,borderColor:C.line},chipActive:{backgroundColor:C.green,borderColor:C.green},chipText:{color:C.muted,fontSize:11,fontWeight:'700'},chipTextActive:{color:'#062015'},
 matchCard:{backgroundColor:C.panel,borderRadius:17,borderWidth:1,borderColor:C.line,padding:14,marginBottom:11},matchTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},leagueText:{fontSize:10,color:C.muted,fontWeight:'700',flex:1},statusPill:{backgroundColor:C.panel2,paddingHorizontal:9,paddingVertical:5,borderRadius:12,flexDirection:'row',alignItems:'center',gap:5},livePill:{backgroundColor:'#3A202B'},ftPill:{backgroundColor:'#1A2C2A'},statusText:{fontSize:9,color:C.muted,fontWeight:'800'},liveDot:{width:6,height:6,borderRadius:3,backgroundColor:C.red},matchTeams:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:17},teamSide:{width:'32%',alignItems:'flex-start'},teamLogo:{width:39,height:39},teamLogoFallback:{width:39,height:39,borderRadius:13,alignItems:'center',justifyContent:'center'},teamInitial:{fontSize:18,fontWeight:'900',color:'#FFFFFF'},teamName:{fontSize:11,color:C.text,fontWeight:'700',marginTop:7,maxWidth:'100%'},scoreBox:{alignItems:'center'},score:{fontSize:25,color:C.text,fontWeight:'900',fontVariant:['tabular-nums']},scoreSep:{color:C.muted,fontWeight:'400'},scoreCaption:{fontSize:8,color:C.muted,letterSpacing:1.2,marginTop:3,fontWeight:'800'},cardFooter:{borderTopWidth:1,borderTopColor:C.line,paddingTop:10,flexDirection:'row',justifyContent:'space-between'},footerText:{fontSize:10,color:C.muted},details:{fontSize:10,color:C.green,fontWeight:'700'},
 filterRow:{flexDirection:'row',gap:7,marginBottom:15},filterChip:{backgroundColor:C.panel,paddingHorizontal:12,paddingVertical:9,borderRadius:15,borderWidth:1,borderColor:C.line},filterActive:{backgroundColor:C.panel2,borderColor:C.green},filterText:{fontSize:10,color:C.muted,fontWeight:'700'},
 tableCard:{backgroundColor:C.panel,borderRadius:18,padding:14,borderWidth:1,borderColor:C.line,marginTop:12},tableTitle:{fontSize:16,color:C.text,fontWeight:'800',marginBottom:14},tableRow:{flexDirection:'row',alignItems:'center',paddingVertical:11,borderTopWidth:1,borderTopColor:C.line,gap:6},tableMuted:{fontSize:8,color:C.muted,fontWeight:'800',flex:0.45,textAlign:'right'},rank:{width:18,fontSize:11,color:C.green,fontWeight:'900'},clubCell:{flex:1,flexDirection:'row',alignItems:'center',gap:6},tableLogo:{width:19,height:19},clubName:{flex:1,fontSize:10,color:C.text,fontWeight:'700'},tableNum:{width:23,textAlign:'right',fontSize:10,color:C.muted,fontVariant:['tabular-nums']},
 leagueCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:C.panel,padding:13,borderRadius:15,borderWidth:1,borderColor:C.line,marginBottom:9},leagueLogo:{width:34,height:34,resizeMode:'contain'},leagueLogoFallback:{width:34,height:34,borderRadius:10,backgroundColor:C.panel2,alignItems:'center',justifyContent:'center'},leagueName:{fontSize:13,color:C.text,fontWeight:'800',marginBottom:4},
 state:{alignItems:'center',justifyContent:'center',paddingVertical:38,gap:10},stateTitle:{fontSize:15,color:C.text,fontWeight:'800'},muted:{fontSize:11,color:C.muted,lineHeight:18},retry:{backgroundColor:C.green,paddingHorizontal:18,paddingVertical:9,borderRadius:12,marginTop:5},retryText:{color:'#062015',fontWeight:'800',fontSize:11},disclaimer:{fontSize:9,color:C.muted,textAlign:'center',marginTop:15,lineHeight:15},errorText:{fontSize:11,color:C.red,marginVertical:10},
 bottom:{height:67,backgroundColor:'#0D1422',borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',justifyContent:'space-around',alignItems:'center',paddingBottom:5},navItem:{alignItems:'center',justifyContent:'center',gap:4,minWidth:60},navText:{fontSize:9,color:C.muted,fontWeight:'700'},
 back:{flexDirection:'row',alignItems:'center',gap:9,marginBottom:25},backText:{fontSize:12,color:C.text,fontWeight:'700'},detailLeague:{textAlign:'center',fontSize:11,color:C.muted,fontWeight:'800',letterSpacing:1},detailScore:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:28,marginBottom:28},detailTeamWrap:{alignItems:'center',flex:1},detailTeam:{color:C.text,fontSize:11,fontWeight:'800',marginTop:10,textAlign:'center'},bigScore:{fontSize:30,color:C.text,fontWeight:'900'},detailStatus:{fontSize:9,color:C.green,fontWeight:'800',marginTop:5},eventRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,borderTopWidth:1,borderTopColor:C.line},eventMinute:{width:42},eventMinuteText:{fontSize:10,color:C.green,fontWeight:'800'},eventTitle:{fontSize:11,color:C.text,fontWeight:'700'},yellowCard:{width:10,height:14,borderRadius:2,backgroundColor:C.yellow},redCard:{width:10,height:14,borderRadius:2,backgroundColor:C.red},statsTeam:{marginBottom:14},statLine:{flexDirection:'row',justifyContent:'space-between',paddingVertical:7,borderTopWidth:1,borderTopColor:C.line}
});
