# Shrimply 🦐

**A tiny pixel shrimp that keeps an eye on your posture.**
 
Shrimply is a small desktop companion for Windows. It lives on your screen, reminds you to sit up straight, and gets visibly unhappy when you ignore it. Use a simple timer, or turn on your webcam and let it notice slouching on its own.


## The Idea Behind the Project

Long hours at a computer are part of everyday life for IT students and for millions of people who work or study on a screen. Over time, most of us begin to lean toward the monitor without noticing: the head moves forward, the shoulders round, and the whole posture slowly curls up, much like a shrimp. The result is neck and back pain, fatigue, and a habit that is hard to break, because the slouching happens gradually and usually goes unnoticed until it already hurts.

Shrimply was created for people who face this problem in their daily life. Instead of a strict alarm, it offers something friendlier: a small pixel shrimp that lives on your screen, gently reminds you to sit up straight, and shows how unhappy it is if the reminders are ignored.

<p align="center">
  <img src="docs/images/the-idea.jpg" alt="A shrimp slouched over a desk" width="350">
</p>

## Features

- **Posture reminders:** after 20 minutes (or 15, 30, 45) the shrimp starts to curl. A soft chime plays, and one click confirms you sat up.
- **Camera Mode (optional):** the shrimp watches your head and shoulders and speaks up as soon as you bend.
- **Angry shrimp:** ignore it for three minutes and it turns angry, with a burning message box and a warning sound.
- **Water reminders:** a gentle nudge once an hour.
- **Daily stats:** a heart that fills up as you fix your posture.
- **Night mode:** the shrimp falls asleep, with no reminders or sounds.
- **Stays out of the way:** small, always on top, draggable, and happy in the system tray.

## Install

[Download **Shrimply-Setup.exe**](https://github.com/dialeelova/shrimply/releases/latest/download/Shrimply-Setup.exe) and run it. No administrator rights needed.
Requires Windows 10 or 11 (64-bit). Closing the window hides Shrimply in the tray; right-click the tray icon to quit.

## Camera Mode

1. Click the camera button in the title bar, turn **Camera mode** on, and allow camera access.
2. Sit up straight and press **Set my posture**. Hold still for a few seconds.
3. Done. If you slouch for about 10 seconds, the shrimp speaks up.

Too many reminders? Lower **Sensitivity**. Missing real slouching? Raise it.

## Privacy

- Pose detection runs fully offline on your computer.
- Video is never saved or sent anywhere.
- A pink dot shows whenever the camera is on.
- Settings and stats stay on your computer.

## Run from Source

Requires [Node.js](https://nodejs.org).

```
git clone https://github.com/dialeelova/shrimply.git
cd shrimply
npm install
npm start
```

Now sit up straight! ✨
