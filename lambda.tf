data "archive_file" "bundle" {
  type        = "zip"
  source_dir  = "${path.module}/src"
  output_path = "${path.module}/.terraform/${var.name}.zip"
}

resource "aws_lambda_function" "lambda" {
  function_name = var.name
  description   = "${var.name} Lambda Cleanup Function"

  filename         = data.archive_file.bundle.output_path
  source_code_hash = data.archive_file.bundle.output_base64sha256
  runtime          = "nodejs20.x"
  memory_size      = 128
  timeout          = 90
  handler          = "index.handler"
  role             = aws_iam_role.janitor.arn
}

resource "aws_cloudwatch_log_group" "logs" {
  name              = "/aws/lambda/${aws_lambda_function.lambda.function_name}"
  retention_in_days = var.log_retention
}
