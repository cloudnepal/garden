/*
 * Copyright (C) 2018 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { PluginContext } from "../plugin-context"
import { BooleanParameter, Command, ParameterValues, StringParameter } from "./base"
import { DeployTask } from "../tasks/deploy"
import { values } from "lodash"
import { Service } from "../types/service"
import chalk from "chalk"
import { TaskResults } from "../task-graph"

export const deployArgs = {
  service: new StringParameter({
    help: "The name of the service(s) to deploy (skip to deploy all services). " +
      "Use comma as separator to specify multiple services.",
  }),
}

export const deployOpts = {
  force: new BooleanParameter({ help: "Force redeploy of service(s)" }),
  "force-build": new BooleanParameter({ help: "Force rebuild of module(s)" }),
}

export type Args = ParameterValues<typeof deployArgs>
export type Opts = ParameterValues<typeof deployOpts>

export class DeployCommand extends Command<typeof deployArgs, typeof deployOpts> {
  name = "deploy"
  help = "Deploy service(s) to the specified environment"

  arguments = deployArgs
  options = deployOpts

  async action(ctx: PluginContext, args: Args, opts: Opts): Promise<TaskResults> {
    ctx.log.header({ emoji: "rocket", command: "Deploy" })

    const names = args.service ? args.service.split(",") : undefined
    const services = await ctx.getServices(names)

    const result = await deployServices(ctx, values(services), !!opts.force, !!opts["force-build"])

    ctx.log.info("")
    ctx.log.info({ emoji: "heavy_check_mark", msg: chalk.green("Done!\n") })

    return result
  }
}

export async function deployServices(
  ctx: PluginContext,
  services: Service<any>[],
  force: boolean,
  forceBuild: boolean,
) {
  for (const service of services) {
    const task = new DeployTask(ctx, service, force, forceBuild)
    await ctx.addTask(task)
  }

  return await ctx.processTasks()
}
