import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { useMapStore, StateProfile } from '@/stores/mapStore';
import { useDeviceState } from '@/hooks/useDeviceState';

const DENSITY_COLORS: Record<string, string> = {
  very_high: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#3B82F6',
};

const LAYER_COLORS: Record<string, string> = {
  sightings: '#3B82F6',
  sounds: '#8B5CF6',
  contributions: '#10B981',
  emergency: '#F59E0B',
};

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  title: string;
  subtitle: string;
  pill?: boolean;
  slug?: string;
}

function buildLeafletHtml(
  centerLat: number,
  centerLng: number,
  zoom: number,
  markers: MapMarker[]
) {
  const markersJson = JSON.stringify(markers);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; }
    .o3l-marker {
      width:24px; height:24px; border-radius:50%; border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    }
    .o3l-pill {
      transform:translate(-50%,-50%);
      color:#fff; padding:4px 10px; border-radius:12px;
      font:700 11px sans-serif; white-space:nowrap;
      border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);
      cursor:pointer; letter-spacing:0.3px;
    }
    .leaflet-popup-content-wrapper { border-radius:8px; }
    .leaflet-popup-content { margin:8px 12px; font-family:sans-serif; }
    .popup-title { font-weight:600; font-size:14px; color:#0a1628; }
    .popup-sub { font-size:12px; color:#6b7280; margin-top:2px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${centerLat}, ${centerLng}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var markers = ${markersJson};
    markers.forEach(function(m) {
      var mk;
      if (m.pill) {
        var pillIcon = L.divIcon({
          className: '',
          html: '<div class="o3l-pill" style="background:' + m.color + '">📍 ' + m.title + '</div>',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });
        mk = L.marker([m.lat, m.lng], { icon: pillIcon, zIndexOffset: 500 }).addTo(map);
        mk.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'state', slug: m.slug }));
        });
      } else {
        var icon = L.divIcon({
          className: '',
          html: '<div class="o3l-marker" style="background:' + m.color + '"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        mk = L.marker([m.lat, m.lng], { icon: icon })
          .addTo(map)
          .bindPopup('<div class="popup-title">' + m.title + '</div><div class="popup-sub">' + m.subtitle + '</div>');
      }
    });

    map.on('moveend', function() {
      var c = map.getCenter();
      var z = map.getZoom();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'move', lat: c.lat, lng: c.lng, zoom: z }));
    });
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const {
    center, zoom, layers, filter,
    setCenter, setZoom, toggleLayer,
    fetchHotspots, fetchObservations, hotspots, observations, loading,
    stateProfiles, activeStateSlug, fetchStateProfiles, selectState,
  } = useMapStore();
  const deviceState = useDeviceState();
  const [showFilters, setShowFilters] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const webViewRef = useRef<InstanceType<typeof WebView>>(null);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    fetchHotspots();
    fetchObservations();
    fetchStateProfiles();
  }, [filter]);

  const activeStateProfile: StateProfile | undefined =
    stateProfiles.find(p => p.slug === activeStateSlug);

  useEffect(() => {
    if (deviceState.latitude && deviceState.longitude) {
      setCenter([deviceState.longitude, deviceState.latitude]);
    }
  }, [deviceState.latitude, deviceState.longitude]);

  const getMarkers = useCallback(() => {
    const markers: MapMarker[] = [];
    const visibleLayers = layers.filter(l => l.visible).map(l => l.id);

    if (visibleLayers.includes('states')) {
      for (const p of stateProfiles) {
        markers.push({
          id: `state-${p.slug}`,
          lat: p.latitude,
          lng: p.longitude,
          color: '#0EA5E9',
          title: p.state,
          subtitle: 'Marine fisheries profile',
          pill: true,
          slug: p.slug,
        });
      }
    }

    if (visibleLayers.includes('hotspots')) {
      for (const h of hotspots) {
        markers.push({
          id: `hotspot-${h.id}`,
          lat: h.latitude,
          lng: h.longitude,
          color: DENSITY_COLORS[h.density_level] || '#3B82F6',
          title: 'Hotspot',
          subtitle: `${h.contribution_count} contributions (${h.density_level})`,
        });
      }
    }

    for (const obs of observations) {
      if (visibleLayers.includes(obs.layer)) {
        markers.push({
          id: `${obs.layer}-${obs.id}`,
          lat: obs.latitude,
          lng: obs.longitude,
          color: LAYER_COLORS[obs.layer] || '#6B7280',
          title: obs.species_name || obs.instrument || obs.type || obs.layer,
          subtitle: obs.species_name
            ? `${obs.number_observed} observed`
            : obs.instrument
            ? `${obs.duration_seconds || 0}s`
            : obs.status || '',
        });
      }
    }

    return markers;
  }, [hotspots, observations, layers, stateProfiles]);

  useEffect(() => {
    const centerLat = center[1] || 10.0;
    const centerLng = center[0] || 79.0;
    const markers = getMarkers();
    setHtmlContent(buildLeafletHtml(centerLat, centerLng, zoom, markers));
  }, [center, zoom, getMarkers]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'move') {
        setCenter([data.lng, data.lat]);
        setZoom(data.zoom);
      } else if (data.type === 'state' && data.slug) {
        selectState(data.slug);
      }
    } catch {}
  }, [setCenter, setZoom, selectState]);

  return (
    <View style={styles.container}>
      {htmlContent ? (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.oceanBlue} />
            </View>
          )}
        />
      ) : (
        <View style={[styles.map, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.oceanBlue} />
        </View>
      )}

      <TouchableOpacity style={styles.layerButton} onPress={() => setShowLayers(!showLayers)}>
        <Text style={styles.layerButtonText}>🗺</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
        <Text style={styles.filterButtonText}>⚙</Text>
      </TouchableOpacity>

      {showLayers && (
        <View style={styles.layerPanel}>
          <Text style={styles.panelTitle}>Map Layers</Text>
          {layers.map(layer => (
            <TouchableOpacity key={layer.id} style={styles.layerItem} onPress={() => toggleLayer(layer.id)}>
              <View style={[styles.layerDot, { backgroundColor: layer.color, opacity: layer.visible ? 1 : 0.3 }]} />
              <Text style={[styles.layerLabel, { opacity: layer.visible ? 1 : 0.5 }]}>{layer.name}</Text>
              <Text style={styles.layerCheck}>{layer.visible ? '✓' : '○'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Filters</Text>
          <Text style={styles.filterLabel}>Density</Text>
          <View style={styles.filterRow}>
            {['low', 'medium', 'high', 'very_high'].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.filterChip, filter.density === d && styles.filterChipActive]}
                onPress={() => useMapStore.getState().setFilter({ density: filter.density === d ? null : d })}
              >
                <Text style={[styles.filterChipText, filter.density === d && styles.filterChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.filterLabel}>Quality Min</Text>
          <View style={styles.filterRow}>
            {[0, 0.3, 0.5, 0.8].map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.filterChip, filter.qualityMin === q && styles.filterChipActive]}
                onPress={() => useMapStore.getState().setFilter({ qualityMin: filter.qualityMin === q ? null : q })}
              >
                <Text style={[styles.filterChipText, filter.qualityMin === q && styles.filterChipTextActive]}>{q}+</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.clearFilterButton} onPress={() => useMapStore.getState().clearFilter()}>
            <Text style={styles.clearFilterText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>🔥 {hotspots.length} hotspots • 📍 {observations.length} observations</Text>
      </View>

      <Modal
        visible={!!activeStateProfile}
        animationType="slide"
        transparent
        onRequestClose={() => selectState(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 {activeStateProfile?.state}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => selectState(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeStateProfile && (
                <View>
                  <Text style={styles.sectionTitle}>Live O3L Contributor Stats</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{activeStateProfile.live_stats.members}</Text>
                      <Text style={styles.statLabel}>Members</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{activeStateProfile.live_stats.contributions}</Text>
                      <Text style={styles.statLabel}>Contributions</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{activeStateProfile.live_stats.verified_contributions}</Text>
                      <Text style={styles.statLabel}>Verified</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{activeStateProfile.live_stats.total_points}</Text>
                      <Text style={styles.statLabel}>Points</Text>
                    </View>
                  </View>
                  <Text style={styles.subtleText}>
                    {activeStateProfile.live_stats.districts_in_db} districts / {activeStateProfile.live_stats.villages_in_db} villages in O3L database
                  </Text>

                  <Text style={styles.sectionTitle}>Marine Fisheries Profile</Text>
                  {[
                    ['Coastal length (km)', activeStateProfile.coastal_length_km],
                    ['Exclusive Economic Zone', activeStateProfile.eez],
                    ['Continental shelf (km²)', activeStateProfile.continental_shelf_km2],
                    ['Coastal districts', String(activeStateProfile.coastal_districts)],
                    ['Marine fishing villages', activeStateProfile.marine_fishing_villages],
                    ['Marine fisherfolk population', activeStateProfile.fisherfolk_population],
                    ['Registered with state welfare', activeStateProfile.welfare_registered],
                    ['Mechanized fishing crafts', String(activeStateProfile.mechanized_crafts)],
                    ['Motorized fishing crafts', String(activeStateProfile.motorized_crafts)],
                    ['Non-motorized fishing crafts', String(activeStateProfile.non_motorized_crafts)],
                    ['Total fishing crafts', String(activeStateProfile.total_crafts)],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.row}>
                      <Text style={styles.rowLabel}>{label}</Text>
                      <Text style={styles.rowValue}>{value}</Text>
                    </View>
                  ))}

                  <Text style={styles.sectionTitle}>Key Fisheries Divisions / Agencies</Text>
                  {activeStateProfile.agencies.map(a => (
                    <View key={a.name} style={styles.card}>
                      <Text style={styles.cardTitle}>{a.name}</Text>
                      <Text style={styles.cardText}>{a.detail}</Text>
                    </View>
                  ))}

                  <Text style={styles.sectionTitle}>Ban Relief / Lean-Period Allowance</Text>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Fishing Ban / Closed Season Relief</Text>
                    <Text style={styles.cardText}>{activeStateProfile.ban_relief_text}</Text>
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Lean-Period / Special Allowance</Text>
                    <Text style={styles.cardText}>{activeStateProfile.lean_allowance_text}</Text>
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Period / Remarks</Text>
                    <Text style={styles.cardText}>{activeStateProfile.period_remarks}</Text>
                  </View>

                  <Text style={styles.sectionTitle}>Lean Fishing Periods</Text>
                  {activeStateProfile.lean_periods.map(lp => (
                    <View key={lp.id} style={styles.card}>
                      <View style={styles.leanHeader}>
                        <Text style={styles.cardTitle}>
                          {lp.district ? `${lp.district} — ` : ''}{lp.region_label}
                        </Text>
                        <View style={styles.periodChip}>
                          <Text style={styles.periodChipText}>{lp.typical_period}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardText}>{lp.main_reason}</Text>
                      <Text style={styles.confidenceText}>Confidence: {lp.confidence}</Text>
                    </View>
                  ))}

                  {!!activeStateProfile.data_note && (
                    <Text style={styles.dataNote}>{activeStateProfile.data_note}</Text>
                  )}
                  <View style={{ height: SPACING.xl }} />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 },
  layerButton: {
    position: 'absolute', top: SPACING.lg, right: SPACING.md,
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  layerButtonText: { fontSize: 22 },
  filterButton: {
    position: 'absolute', top: SPACING.lg + 56, right: SPACING.md,
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  filterButtonText: { fontSize: 22 },
  layerPanel: {
    position: 'absolute', top: SPACING.lg + 112, right: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, width: 200,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  filterPanel: {
    position: 'absolute', top: SPACING.lg + 112, right: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, width: 240,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  panelTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.deepNavy, marginBottom: SPACING.sm },
  layerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs },
  layerDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.sm },
  layerLabel: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.gray[700] },
  layerCheck: { fontSize: FONT_SIZE.sm, color: COLORS.seaGreen, fontWeight: '600' },
  filterLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.gray[500], marginTop: SPACING.sm, marginBottom: SPACING.xs },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  filterChip: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.gray[100] },
  filterChipActive: { backgroundColor: COLORS.oceanBlue },
  filterChipText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600] },
  filterChipTextActive: { color: COLORS.white },
  clearFilterButton: { marginTop: SPACING.md, paddingVertical: SPACING.sm, alignItems: 'center' },
  clearFilterText: { fontSize: FONT_SIZE.sm, color: COLORS.coral, fontWeight: '500' },
  statsBar: {
    position: 'absolute', bottom: SPACING.xl, left: SPACING.md, right: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
  },
  statsText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600] },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(10,22,40,0.55)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '85%',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.deepNavy, flex: 1 },
  modalClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray[100],
    justifyContent: 'center', alignItems: 'center',
  },
  modalCloseText: { fontSize: FONT_SIZE.sm, color: COLORS.gray[700], fontWeight: '700' },
  sectionTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.oceanBlue,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: SPACING.md, marginBottom: SPACING.xs,
  },
  statsGrid: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xs },
  statBox: {
    flex: 1, backgroundColor: COLORS.gray[100], borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, alignItems: 'center',
  },
  statValue: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.deepNavy },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600], marginTop: 2 },
  subtleText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500] },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  rowLabel: { fontSize: FONT_SIZE.sm, color: COLORS.gray[600], flex: 1, marginRight: SPACING.sm },
  rowValue: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.deepNavy, flexShrink: 1, textAlign: 'right' },
  card: {
    backgroundColor: COLORS.gray[100], borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.xs,
  },
  cardTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.deepNavy },
  cardText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[600], marginTop: 2, lineHeight: 16 },
  leanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.xs },
  periodChip: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.oceanBlue, paddingHorizontal: 6, paddingVertical: 2,
  },
  periodChipText: { fontSize: FONT_SIZE.xs, color: COLORS.oceanBlue, fontWeight: '600' },
  confidenceText: { fontSize: FONT_SIZE.xs, color: COLORS.gray[500], fontStyle: 'italic', marginTop: 4 },
  dataNote: {
    fontSize: FONT_SIZE.xs, color: COLORS.gray[500],
    borderTopWidth: 1, borderTopColor: COLORS.gray[100],
    marginTop: SPACING.md, paddingTop: SPACING.sm, lineHeight: 15,
  },
});
