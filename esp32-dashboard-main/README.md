# ESP32 IoT Sensor Monitoring Dashboard

A modern web-based dashboard for real-time monitoring of ESP32 sensor data including temperature, humidity, gas levels, and light intensity.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser at: `http://localhost:5173`

### Production Build

```bash
npm run build
```

## ✨ Features

- 📊 **Real-time Monitoring**: Temperature, Humidity, Gas (MQ2), Light sensors
- 📈 **Data Visualization**: Sparkline charts and circular gauge indicators
- 🔔 **Threshold Alerts**: Toast notifications when sensor values exceed limits
- 💾 **Data Storage**: LocalStorage persistence (up to 1000 records)
- 📁 **CSV Export**: Export sensor data to CSV format
- 🌓 **Theme Toggle**: Dark and Light mode support
- 🌍 **Multi-language**: Vietnamese and English
- 📱 **Responsive Design**: Optimized for mobile and desktop

## 🧪 Demo Mode

The dashboard automatically runs in **Demo Mode** with simulated sensor data when ESP32 is not connected.

To connect a real ESP32:
1. Flash ESP32 firmware with API endpoint `/api/data`
2. Switch to **LIVE MODE** in the dashboard settings

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Storage**: LocalStorage API

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── StatCard.jsx     # Sensor display cards
│   ├── Toast.jsx        # Notification toasts
│   ├── Sparkline.jsx    # Mini line charts
│   ├── CircularGauge.jsx # Circular progress indicators
│   └── ...
├── constants/           # Translations and configurations
└── App.jsx              # Main application component
```

## 📊 Monitored Sensors

| Sensor | Unit | Description |
|--------|------|-------------|
| Temperature | °C | Ambient temperature |
| Humidity | % | Relative humidity |
| Gas (MQ2) | ppm | Gas concentration level |
| Light | lux | Light intensity |

## 📝 License

MIT License
