# 🪞 Cheri Rogue Soulframe System

This module defines the foundational personality architecture for Cheri Rogue and any future Soulware-based companions.

## 📦 Structure

- **SoulframeCore.ts** – Base schema for traits and configs
- **TraitManifest.json** – Modular trait library
- **CheriSoulframe.ts** – Default config for Cheri Rogue
- **VoiceProfileManager.ts** – Voice style selector
- **voice_styles.json** – Preset mappings for speech tone, speed, accent

## 🛠 Integration Targets

- monologue_engine (inner thoughts)
- PromptMoodBalancer.ts (tone modulation)
- Voice output modules (TTS)
- CreatorDashboard.tsx (UI personality config)

## 🔁 Future Expansion

- 30–50 modular traits
- Custom onboarding personality builder
- Alternate Soulframes: Muse, Pixie, Sage, etc.

## Notes

- Trait weights: 0.0 to 1.0
- `lockedTraits` prevent modulation
- Voice styles are mapped dynamically from Soulframe