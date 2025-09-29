import RadialChart from "./radChart"

export default function Weather({ airTemp, trackTemp, humidity, pressure, rain, windSpeed, windDir }: { airTemp: number, trackTemp: number, humidity: number, pressure: number, rain: boolean, windSpeed: number, windDir: number }) {
  return (
    <div className="flex flex-col! sm:flex-row gap-2 text-sm text-neutral-300">
      <RadialChart
        value={airTemp}
        min={0}
        max={50}
        label="AIR"
        sublabel="°C"
        theme="dark"
        size={90}
        startColor="#7aeb34"
        endColor="#eb6534"
      />
      <RadialChart
        value={airTemp}
        min={0}
        max={70}
        label="TRACK"
        sublabel="°C"
        theme="dark"
        size={90}
        startColor="#7aeb34"
        endColor="#eb6534"
      />
      <RadialChart
        value={humidity}
        min={0}
        max={100}
        label="HUMID"
        sublabel="%"
        theme="dark"
        size={90}
        startColor="#34d9eb"
        endColor="#3452eb"
      />
      <RadialChart
        value={pressure}
        min={900}
        max={1100}
        label="PRESS"
        sublabel="hPa"
        theme="dark"
        size={90}
        startColor="#eb34d9"
        endColor="#5234eb"
      />
      {
        rain && (
          <div className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15zM16 13l-1.5 1.5M16 17l-1.5 1.5M12.75 15l-1.5 1.5M12.75 19l-1.5 1.5M8.5 15L7 16.5M8.5 19L7 20.5" />
            </svg>
            <span className="text-sm font-bold text-blue-500">RAIN</span>
          </div>
        )
      }
      {
        windSpeed > 0 ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-green-400" style={{ transform: `rotate(${windDir}deg)` }}>
                <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <polygon points="12,2 8,8 16,8" fill="currentColor"/>
              </svg>
              <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-black">
                {windSpeed}
              </div>
            </div>
            <span className="text-sm font-bold text-green-400">WIND</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15zM16 13l-1.5 1.5M16 17l-1.5 1.5M12.75 15l-1.5 1.5M12.75 19l-1.5 1.5M8.5 15L7 16.5M8.5 19L7 20.5" />
            </svg>
            <span className="text-sm font-bold text-green-400">CALM</span>
          </div>
        )
      }
    </div>
  )
}