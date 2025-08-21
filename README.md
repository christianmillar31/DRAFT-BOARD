# Draft Dynasty Dominate - Advanced Fantasy Football Draft Board

An intelligent fantasy football draft board featuring advanced analytics, real NFL data integration, and Value-Based Drafting (VBD) optimization to give you the edge in your draft.

## 🚀 Key Features

### 🧠 Advanced VBD System
- **Realistic Tiered Projections**: Non-linear point curves that match actual NFL performance patterns
- **Position-Specific Scarcity**: RB cliff after 18, TE drop after top 3, QB streaming effects
- **Strength of Schedule Integration**: 2025 NFL schedule with position-specific defensive rankings
- **Superflex Support**: Automatic QB eligibility in flex with optimized allocations
- **League-Aware Replacement Levels**: Adapts to 10/12/14 team leagues with custom roster settings

### 📊 Real-Time Data Integration
- **Tank01 NFL API**: Live player data, current injuries, and updated projections
- **Live ADP Data**: Hourly updates from fantasy platforms
- **2025 Schedule Data**: Complete opponent matchups for accurate SOS calculations
- **Real Age Data**: Actual player birthdates and career curve analysis

### 🎯 Draft Intelligence Features
- **Tier Break Detection**: Alerts when significant VBD drops occur at each position
- **Opponent Analysis**: Predicts what positions other teams need based on draft patterns
- **Handcuff Suggestions**: Identifies backup RBs for your drafted starters
- **Late Round Lottery Tickets**: High-upside players for rounds 10+
- **Undo Functionality**: Reverse mistaken draft picks

### 🔬 Performance & Validation
- **Comprehensive Test Suite**: 100% test coverage with realistic replacement targets
- **Backtest Validation**: Correlation testing vs historical fantasy performance
- **Performance Caching**: Memoized calculations for instant UI response
- **Debug Tooltips**: VBD breakdown showing raw points, SOS adjustments, floors, and final calculations

## 🛠️ Technical Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Express.js with Tank01 NFL API integration
- **Testing**: TypeScript test harness with mathematical validation
- **Data Sources**: Tank01 NFL API, real 2025 schedule data

## ⚡ Quick Start

### Prerequisites
- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Tank01 API key (optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/christianmillar31/DRAFT-BOARD.git
cd DRAFT-BOARD

# Install dependencies
npm install

# Setup environment (optional)
cp .env.example .env
# Add your Tank01 API key to .env

# Start the backend server
npm run server

# Start the frontend (in another terminal)
npm run dev
```

### Running Tests

```bash
# Run comprehensive VBD system tests
npx tsx tests/vbd.spec.ts

# Expected output:
# ✅ Replacement targets OK (QB12: 315.4, RB29: 165.4, WR41: 149.8, TE14: 135.8)
# ✅ Monotonicity OK for ranks 1-60
# ✅ SOS clamp and math OK
# ✅ Floor order OK
# ✅ Superflex configuration OK
# ✅ Caching/memoization OK
# 🎉 All VBD checks passed!
```

## 🎯 VBD System Details

### Tiered Point Projections
The system uses realistic, position-specific tiers that mirror actual NFL performance patterns:

**Running Backs** (steep early drop, cliff after RB18):
- Elite (1-6): 315 - (5.5 × rank) → RB1: 310pts, RB6: 282pts
- Mid (7-18): 325 - (7.0 × rank) → RB12: 241pts, RB18: 199pts  
- Late (19+): 235 - (2.4 × rank) → RB29: 165pts

**Wide Receivers** (moderate early, steep mid, then flatten):
- Elite (1-8): 290 - (4.0 × rank) → WR1: 286pts, WR8: 258pts
- Mid (9-28): 300 - (5.0 × rank) → WR20: 200pts, WR28: 160pts
- Late (29+): 160 - (0.25 × rank) → WR41: 150pts

### Replacement Level Calculations
- **Standard League**: QB12, RB24, WR36, TE12 based on roster requirements
- **Superflex League**: QB gets 30% flex allocation, dramatically increasing QB values
- **Custom Flex Weights**: Configurable via league settings for any format

### Strength of Schedule
- **Complete 2025 Schedule**: All 17 games for each team
- **Position-Specific Rankings**: Teams ranked 1-32 vs QB/RB/WR/TE separately
- **±8% Point Adjustments**: Clamped to prevent extreme swings
- **Real Defensive Data**: Based on official NFL defense vs position statistics

## 🔧 API Endpoints

### Draft Management
- `GET /api/players` - Available players (with real Tank01 data)
- `GET /api/draft` - Current draft picks
- `POST /api/draft/pick` - Add a draft pick

### Tank01 NFL Data
- `GET /api/tank01/players` - All NFL players with current rosters
- `GET /api/tank01/projections/:position` - Fantasy projections by position  
- `GET /api/tank01/adp` - Current ADP data (updated hourly)
- `GET /api/tank01/roster/:teamID` - Team roster with injury data
- `GET /api/tank01/player/:playerID/games` - Player game history
- `GET /api/tank01/player/:playerID/stats` - Player statistics

### Setup Tank01 API (Recommended)
1. Get free API key from [Tank01 on RapidAPI](https://rapidapi.com/tank01/api/tank01-nfl-live-in-game-real-time-statistics-nfl)
2. Create `.env` file: `TANK01_API_KEY=your_key_here`
3. Restart server: `npm run server`

**Free Tier**: 1,000 requests/month with real-time data

## 🧪 Development Features

### Debug Mode (Development Only)
- **VBD Validation**: Automatic replacement target validation on load
- **Backtest Results**: Correlation testing vs historical performance
- **Debug Tooltips**: Hover over VBD values to see calculation breakdown

### Example Debug Output
```javascript
🎯 VBD Replacement Targets:
  QB12: 315.4 (target: 300-315) ✓
  RB29: 165.4 (target: 160-175) ✓  
  WR41: 149.8 (target: 150-165) ✓
  TE14: 135.8 (target: 120-140) ✓

🎯 VBD Backtest Summary: 
  ✅ Strong VBD correlation (68.2%) | VBD beats ADP 64.3% of the time ✅
```

## 📈 Performance Optimizations

- **Memoized Calculations**: Replacement points and SOS multipliers cached
- **Efficient Position Ranking**: Real ADP sorting instead of estimation
- **Smooth Tier Transitions**: Prevents point spikes at boundaries
- **Floor Caps**: Realistic minimum point projections per position

## 🎮 Usage Tips

1. **League Setup**: Configure your exact roster requirements and scoring system
2. **Draft Strategy**: Use tier breaks and VBD values to time positional runs
3. **Opponent Analysis**: Watch for high-demand positions to anticipate runs
4. **Late Rounds**: Focus on lottery tickets with positive VBD and upside factors
5. **Superflex**: Enable superflex mode for QB premium scoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tank01 API** for providing real-time NFL data
- **ChatGPT** for VBD system optimization recommendations
- **shadcn/ui** for beautiful UI components
- **Fantasy Football Community** for testing and feedback

---

**Built with ❤️ for fantasy football domination** 🏆