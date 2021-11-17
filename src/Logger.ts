import { Logger } from "@ethersproject/logger"
import { version } from "./_version"

const logger = new Logger(version)

export {
  logger,
  Logger
}