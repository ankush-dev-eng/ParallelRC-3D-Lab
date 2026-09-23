# Interactive 3D Parallel RC Engineering Lab

## Problem Statement Fit

**Subject:** Physics and Physical Sciences  
**Topic:** Electric Circuits Lab  
**Challenge:** Parallel RC Circuits

This project is an interactive 3D simulation for learning the behavior of a parallel RC circuit under AC excitation.

The learner manually places a resistor and capacitor on a virtual breadboard, configures voltage, frequency, resistance, and capacitance, and then observes the resulting branch and total currents.

The simulation focuses on the key concepts from the challenge:

- Capacitive reactance and its dependence on frequency.
- Resistor current and capacitor current in parallel.
- Vector summation of branch currents.
- The phase relationship between voltage and total current.
- Measurement of branch and total current.
- Safe operation when capacitor current becomes excessive.

The problem statement is inspired by the Virtual Labs educational material referenced by the Hackathon.

## Target Users

The primary users are students learning AC circuits, electronics, and basic electrical engineering concepts.

The simulation is designed for learners who benefit from seeing circuit behavior change interactively instead of relying only on equations or static diagrams.

The main learning difficulties addressed are:

- Understanding how resistor and capacitor currents coexist in a parallel circuit.
- Understanding why capacitor current increases with frequency.
- Visualizing phase relationships using phasor vectors.
- Connecting theoretical calculations with instrument-style measurements.
- Understanding why excessive operating conditions can require a safety shutdown.

## What We Built

We built a browser-based interactive 3D laboratory environment for a parallel RC circuit.

The learner can assemble the circuit on a virtual breadboard, control the AC source, move a virtual current clamp between measurement points, observe a dual-trace oscilloscope, inspect a 3D phasor diagram, perform a frequency challenge, trigger and recover from a simulated capacitor safety event, and generate a final laboratory report.

The experiment uses one shared electrical calculation for the circuit so that the live readings, current clamp, oscilloscope, phasor diagram, safety system, and report remain consistent with the same experiment state.

## Core Features

- **3D circuit assembly** — manually drag and snap the resistor and capacitor onto valid parallel breadboard positions.
- **Live electrical controls** — adjust AC voltage, frequency, resistance, and capacitance.
- **Current measurement workflow** — move the virtual current clamp between resistor, capacitor, and total-current measurement points.
- **Virtual oscilloscope** — dual traces for source voltage and the selected current measurement.
- **3D phasor analysis** — visualizes IR, IC, and IT with the total-current phase angle.
- **Guided frequency challenge** — reach approximately IC = 5 × IR for the reference circuit.
- **Capacitor safety system** — accumulated stress produces a warning, automatic trip, generator shutdown, and recovery sequence.
- **Automatic measurement logging** — stabilized measurements are added to the experiment notebook.
- **Final laboratory report** — compares measured and theoretical current values, records safety verification, and includes learner reflection.
- **Three laboratory camera views** — Bench, Board, and Analysis views for different experiment stages.

## Technical Architecture

The application follows a shared-state, shared-physics design:

```text
User Action
    ↓
Central Lab State
    ↓
Pure Electrical Physics
    ↓
Electrical Snapshot
    ↓
Simulation Runtime
    ├── Safety stress integration
    ├── Generator trip/recovery
    └── Time-dependent simulation state
    ↓
Instruments / Analysis / Report
