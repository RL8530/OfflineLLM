# LLM Chat Demo - React Native Mobile App

<div align="center">

A cross-platform mobile demo application showcasing offline AI model management and chat functionality.

<p float="left">
  <img width="200" alt="Simulator Screenshot - iPhone 16 Pro - 2025-11-26 at 15 01 43" src="https://github.com/user-attachments/assets/c6ea626c-9519-4982-84bc-1197b7645d2b" />
  &nbsp; &nbsp; 
  <img width="200" alt="Simulator Screenshot - iPhone 16 Pro - 2025-11-26 at 13 50 00" src="https://github.com/user-attachments/assets/f7e13940-b1be-499a-be10-175a70c53273" />
  &nbsp; &nbsp; 
  <img width="200" alt="Simulator Screenshot - iPhone 16 Pro - 2025-11-26 at 14 14 29" src="https://github.com/user-attachments/assets/6f9c70b3-05fe-4504-882d-88fe0202d44a" />
  &nbsp; &nbsp; 
  <img width="200" alt="Simulator Screenshot - iPhone 16 Pro - 2025-11-26 at 13 50 11" src="https://github.com/user-attachments/assets/831d7a78-a158-42b2-a239-1ca98d2920f5" />
</p>

</div>

## App Screens

### Home Screen
- Quick stats (chat sessions, downloaded models)
- Recent activity preview

### Downloads Screen
- Browse available models
- Download models
- Manage downloaded files

### Chat Screen
- AI response simulation
- Model selection and switching between downloaded models
- Export conversations as shareable text

### Settings Screen
- App theme selection


## Tech Stack

- React Native, TypeScript, Expo
- Storage: Expo FileSystem
- State Management: React Hooks + Context

## Installation

```bash
# Clone the repository
cd OfflineLLM

# Install dependencies
npm install

# Start development
npx expo run:ios

# How to use the chat
1. Go to "Downloads" tab
2. Select a model to download. Phi-2(2.7B)-Q4_K_M is preferred.
3. go to "Chat" tab and tap "Select a model" to mount the downloaded model.
4. Done
```

## How to use the chat

```bash
1. Go to "Downloads" tab
2. Select a model to download. Phi-2(2.7B)-Q4_K_M is preferred.
3. go to "Chat" tab and tap "Select a model" to mount the downloaded model.
4. Done
```

## 📄 License

This project is created for **portfolio and demonstration purposes**. The code is available for review and learning modern React Native development patterns.
