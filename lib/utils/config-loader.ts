import * as fs from "fs";
import * as path from "path";
import { PortfolioConfig } from "../types/portfolio-config";

export class ConfigLoader {
  private static config: PortfolioConfig | null = null;

  public static loadConfig(): PortfolioConfig {
    if (this.config) {
      return this.config;
    }

    const configPath = path.join(
      __dirname,
      "../../config/portfolio-config.json"
    );

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const configData = fs.readFileSync(configPath, "utf8");
    this.config = JSON.parse(configData) as PortfolioConfig;

    console.log(
      `Loaded configuration for environment: ${this.config.environment}`
    );
    console.log(
      `Service desired counts: User=${this.config.services.userService.desiredCount}, Product=${this.config.services.productService.desiredCount}, Order=${this.config.services.orderService.desiredCount}`
    );

    return this.config;
  }

  public static getServiceConfig(
    serviceName: keyof PortfolioConfig["services"]
  ): ServiceConfig {
    const config = this.loadConfig();
    return config.services[serviceName];
  }

  public static isProductionMode(): boolean {
    const config = this.loadConfig();
    return config.environment === "production";
  }

  public static isDevelopmentMode(): boolean {
    const config = this.loadConfig();
    return config.environment === "development";
  }
}
