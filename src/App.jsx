import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

const SOCKET_Z = { hot: 0.7, return: -0.7 };
const COLUMN_X = [-3.2, -1.6, 0, 1.6, 3.2];
const SNAP_RADIUS = 1.0;
const DRAG_HEIGHT = 0.42;
const TRAY_POSITION = [5.0, DRAG_HEIGHT, -2.5];

function Socket({ x, z, active }) {
  return (
    <mesh position={[x, 0.16, z]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.12, 0.12, 0.06, 24]} />
      <meshStandardMaterial
        color={active ? '#7c3aed' : '#334155'}
        emissive={active ? '#5b21b6' : '#000000'}
        emissiveIntensity={active ? 0.8 : 0}
      />
    </mesh>
  );
}

function SnapGuide({ x, highlighted }) {
  return (
    <group position={[x, 0.18, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[0.55, 0.025, 1.9]} />
        <meshStandardMaterial
          color={highlighted ? '#22c55e' : '#64748b'}
          transparent
          opacity={highlighted ? 0.34 : 0.08}
          emissive={highlighted ? '#16a34a' : '#000000'}
          emissiveIntensity={highlighted ? 0.7 : 0}
        />
      </mesh>
    </group>
  );
}

function Resistor({ position, dragging, onPointerDown, onPointerMove, onPointerUp }) {
  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        if (!dragging) document.body.style.cursor = 'default';
      }}
    >
      {/* The resistor axis is along Z so its two leads line up with the A/B rows. */}
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.55, 20]} />
        <meshStandardMaterial color={dragging ? '#fbbf24' : '#f97316'} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.52]}>
        <cylinderGeometry args={[0.045, 0.045, 0.42, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, -0.52]}>
        <cylinderGeometry args={[0.045, 0.045, 0.42, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.32, 0.03, 0.07]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.14, -0.14]}>
        <boxGeometry args={[0.32, 0.03, 0.07]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0.14, 0.14]}>
        <boxGeometry args={[0.32, 0.03, 0.07]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
    </group>
  );
}

function LabScene({ resistorPosition, dragging, candidateColumn, snappedColumn, onPointerDown, onPointerMove, onPointerUp }) {
  const socketPairs = useMemo(
    () => COLUMN_X.map((x, index) => ({ index, x, zHot: SOCKET_Z.hot, zReturn: SOCKET_Z.return })),
    []
  );

  return (
    <Canvas
      camera={{ position: [0, 8.5, 8.5], fov: 45 }}
      shadows
      onPointerMissed={() => {
        if (!dragging) document.body.style.cursor = 'default';
      }}
    >
      <color attach="background" args={['#070b12']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 8, 5]} intensity={2.4} castShadow />
      <pointLight position={[-4, 3, -2]} intensity={30} distance={15} />

      {/* Bench: deliberately simple geometry for the performance spike. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 7]} />
        <meshStandardMaterial color="#18212b" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.09, 0]} receiveShadow>
        <boxGeometry args={[9, 0.18, 3]} />
        <meshStandardMaterial color="#273240" roughness={0.55} />
      </mesh>

      {/* Ten fixed sockets: five on the HOT strip and five on the RETURN strip. */}
      {socketPairs.map(({ index, x }) => (
        <React.Fragment key={index}>
          <Socket x={x} z={SOCKET_Z.hot} active={candidateColumn === index || snappedColumn === index} />
          <Socket x={x} z={SOCKET_Z.return} active={candidateColumn === index || snappedColumn === index} />
          <SnapGuide x={x} highlighted={candidateColumn === index || snappedColumn === index} />
        </React.Fragment>
      ))}

      <Resistor
        position={resistorPosition}
        dragging={dragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* Tray marker shows where a failed drop returns the component. */}
      <mesh position={TRAY_POSITION}>
        <boxGeometry args={[1.4, 0.08, 1.4]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>
    </Canvas>
  );
}

export default function App() {
  const [resistorPosition, setResistorPosition] = useState(TRAY_POSITION);
  const [dragging, setDragging] = useState(false);
  const [candidateColumn, setCandidateColumn] = useState(null);
  const [snappedColumn, setSnappedColumn] = useState(null);
  const [errors, setErrors] = useState(0);

  // A fixed horizontal plane turns a 2D pointer drag into a predictable 3D bench position.
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  function getBenchPoint(event) {
    return event.ray.intersectPlane(dragPlane, new THREE.Vector3());
  }

  function getClosestColumn(point) {
    let bestIndex = null;
    let bestDistance = Infinity;

    for (let i = 0; i < COLUMN_X.length; i += 1) {
      // Each legal resistor placement is centered between one HOT and one RETURN socket.
      const distance = Math.hypot(point.x - COLUMN_X[i], point.z);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }

    return bestDistance <= SNAP_RADIUS ? bestIndex : null;
  }

  function handlePointerDown(event) {
    event.stopPropagation();
    event.target.setPointerCapture?.(event.pointerId);
    setDragging(true);
    setSnappedColumn(null);
    document.body.style.cursor = 'grabbing';
  }

  function handlePointerMove(event) {
    if (!dragging) return;
    event.stopPropagation();

    const point = getBenchPoint(event);
    if (!point) return;

    const nextPosition = [point.x, DRAG_HEIGHT, point.z];
    const nextCandidate = getClosestColumn(point);

    setResistorPosition(nextPosition);
    setCandidateColumn(nextCandidate);
  }

  function handlePointerUp(event) {
    if (!dragging) return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);

    const candidate = candidateColumn;

    if (candidate !== null) {
      // Successful snap: place the resistor exactly between its two legal sockets.
      setResistorPosition([COLUMN_X[candidate], DRAG_HEIGHT, 0]);
      setSnappedColumn(candidate);
    } else {
      // Failed drop: return the part to the component tray and record the procedural error.
      setResistorPosition(TRAY_POSITION);
      setErrors((value) => value + 1);
      setSnappedColumn(null);
    }

    setCandidateColumn(null);
    setDragging(false);
    document.body.style.cursor = 'default';
  }

  function resetSpike() {
    setResistorPosition(TRAY_POSITION);
    setDragging(false);
    setCandidateColumn(null);
    setSnappedColumn(null);
    setErrors(0);
    document.body.style.cursor = 'default';
  }

  const circuitAssembled = snappedColumn !== null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#070b12',
        color: '#e5e7eb',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <LabScene
          resistorPosition={resistorPosition}
          dragging={dragging}
          candidateColumn={candidateColumn}
          snappedColumn={snappedColumn}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          width: 330,
          padding: 18,
          borderRadius: 16,
          background: 'rgba(8, 12, 20, 0.88)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Parallel RC — Drag & Snap Spike</div>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
          Test only: drag the resistor from the tray and place it across one HOT/RETURN socket pair.
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 8, fontSize: 13 }}>
          <div><strong>Drag:</strong> {dragging ? 'yes' : 'no'}</div>
          <div><strong>Snap candidate:</strong> {candidateColumn === null ? 'none' : `column ${candidateColumn + 1}`}</div>
          <div><strong>Snapped:</strong> {snappedColumn === null ? 'no' : `column ${snappedColumn + 1}`}</div>
          <div>
            <strong>circuitAssembled:</strong>{' '}
            <span style={{ color: circuitAssembled ? '#22c55e' : '#f97316' }}>
              {String(circuitAssembled)}
            </span>
          </div>
          <div><strong>Procedural errors:</strong> {errors}</div>
        </div>

        <button
          onClick={resetSpike}
          style={{
            marginTop: 16,
            width: '100%',
            border: 0,
            borderRadius: 10,
            padding: '10px 12px',
            background: '#7c3aed',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reset Spike
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 16px',
          borderRadius: 999,
          background: 'rgba(8, 12, 20, 0.9)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          fontSize: 13,
          color: '#cbd5e1',
        }}
      >
        Purple sockets = valid targets • Release near a column to snap • Drop elsewhere to return to tray
      </div>
    </div>
  );
}
