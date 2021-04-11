resource "aws_cloudwatch_event_rule" "schedule" {
  name                = var.name
  description         = "${var.name} Schedule"
  schedule_expression = var.schedule_expression
}

resource "aws_cloudwatch_event_target" "schedule" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = var.name
  arn       = aws_lambda_function.lambda.arn
}

resource "aws_lambda_permission" "schedule" {
  statement_id  = "EventsExecution"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}