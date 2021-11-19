variable "name" {
  type        = string
  description = "Lambda function name"
  default     = "Lambda-Janitor"
}

variable "schedule_expression" {
  type        = string
  description = "CloudWatch Cron schedule expression"
  default     = "cron(0 3 * * ? *)"
}

variable "log_retention" {
  type        = number
  description = "Retention in days for CloudWatch Logs"
  default     = 7
}

variable "boundary_policy" {
  type        = string
  description = "Boundary policy ARN"
  default     = null
}