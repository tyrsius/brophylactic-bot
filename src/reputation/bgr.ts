import { Message } from 'discord.js'
import moment from 'moment'
import R from 'ramda'
import { CommandModule } from 'yargs'
import { IAppContext } from '../context'

export function bgrCommand(context: IAppContext): CommandModule {
  return {
    command: 'bgr <command>',
    describe: 'Brophylactic Gaming Reputation (℞), the server currenc',
    builder: yargs =>
      yargs
        .command({
          command: 'send [to] [amount]',
          describe: 'send Brophylactic Gaming Reputation (℞)',
          builder: y =>
            y
              .positional('to', {
                description: 'Send BGR to a user',
                type: 'string',
                implies: 'amount'
              })
              .positional('amount', {
                description: 'amount of BGR to send',
                type: 'number'
              }),
          handler: handleWrapper(context)
        })
        .command({
          command: 'view',
          describe: 'view Brophylactic Gaming Reputation (℞)',
          handler: handleWrapper(context)
        }),
    // tslint:disable-next-line:no-empty
    handler: () => {}
  }
}

function handleWrapper(context: IAppContext) {
  return (argv: any) => {
    argv.promisedResult = bgrHandler(context, argv)
    return argv.promisedResult
  }
}

export async function bgrHandler(
  context: IAppContext,
  { message, to, amount }: { message: Message; to: string; amount: number }
) {
  // Init
  const { channel, member, guild } = message
  const {
    stores: { reputation }
  } = context

  let bgr = await reputation.getUserRep(member)
  if (!to) {
    let joined = moment(member.joinedAt).format('YYYY-MM-DD')
    await channel.send(`${member.displayName} joined on ${joined} has ℞${bgr}`)
    return
  }
  // Find the user
  const memberToReceive = guild.members.find(m => m.displayName === to)
  if (!memberToReceive) {
    await channel.send(`Unable to find member with the username ${to}`)
    return
  }
  let sendMessage = (await channel.send(
    `${member.displayName} is sending ${memberToReceive.displayName} ℞${amount}`
  )) as Message
  await reputation.exchangeUserRep(member, memberToReceive, amount)
  let [senderRep, receiverRep] = await Promise.all([
    reputation.getUserRep(member),
    reputation.getUserRep(memberToReceive)
  ])
  await sendMessage.edit(
    `${member.displayName} sent ${memberToReceive.displayName} ℞${amount}. ${
      member.displayName
    }: ℞${senderRep}, ${memberToReceive.displayName}: ℞${receiverRep}`
  )
  await message.delete()
}