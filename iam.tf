resource "aws_iam_role" "janitor" {
  name                 = var.name
  assume_role_policy   = data.aws_iam_policy_document.assume_role.json
  permissions_boundary = var.boundary_policy
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "janitor" {
  name   = "Lambda-Actions"
  role   = aws_iam_role.janitor.id
  policy = data.aws_iam_policy_document.janitor.json
}

data "aws_iam_policy_document" "janitor" {
  # Both actions remain scoped to log streams. Resource is the log group ARN
  # followed by ":*" so it only matches streams in this function's log group.
  # No log group ARN statement is needed because this policy grants no log
  # group actions (see the CloudWatch Logs resource-level permission change).
  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["${aws_cloudwatch_log_group.logs.arn}:*"]
  }

  statement {
    sid = "LambdaActions"
    actions = [
      "lambda:ListFunctions",
      "lambda:ListAliases",
      "lambda:ListVersionsByFunction",
      "lambda:DeleteFunction",
    ]
    resources = ["*"]
  }
}