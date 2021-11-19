# Terraform-AWS-Lambda-Janitor

Clean up unused Lambda function in the current AWS Account.

Based upon Yan Cui's [Lambda Janitor](https://theburningmonk.medium.com/aws-lambda-janitor-lambda-function-to-clean-up-old-deployment-packages-63dd28210474)

In order to keep within the 75G limit of Lambda function code storage, this function removes unused function versions.

A version is defined to be unused if it:
- Isn't $LATEST
- Isn't referenced by a function Alias

The function is configured to run according to a schedule.  By default this is at 3am UTC, however the schedule is configurable with the `schedule_expression` parameter.

## Example Usage

```HCL
module "janitor" {
  source = "git@github.com:barneyparker/terraform-aws-lambda-janitor.git?ref=v1.0.0"

  name = "Janitor"
}
```

## Parameters

| Name | Description | Required | Default |
|---|---|---|---|
| `name` | Lambda function name | Yes | |
| `schedule_expression` | CloudWatch Cron schedule expression | No | `cron(0 3 * * ? *)` |
| `log_retention` | Retention in days for CloudWatch Logs | No | 7 |
| `boundary_policy` | Boundary policy ARN | No | `null` |

## Attributes

None
