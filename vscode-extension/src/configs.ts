import * as fs from 'fs'

export class ChronicleConfig {
  private configFile: string = 'chronicle-config.json'
  private logFile: string = 'chronicle-log.txt'
  private configData: any = {}

  constructor() {
    this.loadConfig()
  }

  public getApiKey(): string | null {
    return this.configData.api_key || null
  }

  public setApiKey(key: string): void {
    this.configData.api_key = key
    this.saveConfig(this.configData)
  }

  private loadConfig(): any {
    try {
      const data = fs.readFileSync(this.configFile, 'utf8')
      this.configData = JSON.parse(data)
    } catch (error) {
      console.error('Error loading config:', error)
      this.configData = {}
      this.saveConfig(this.configData)
    }
  }

  private saveConfig(config: any): void {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2))
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  public log(message: string): void {
    const timestamp = new Date().toISOString()
    fs.appendFileSync(this.logFile, `[${timestamp}] ${message}\n`)
  }
}
