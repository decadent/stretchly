const { UntilMorning } = require('./untilMorning')
const log = require('electron-log')

const allOptions = {
  title: {
    long: '--title',
    short: '-T',
    description: 'Specify title for next break (Long or Mini)',
    withValue: true
  },
  text: {
    long: '--text',
    short: '-t',
    description: 'Specify text for next break (Long Break only)',
    withValue: true
  },
  noskip: {
    long: '--noskip',
    short: '-n',
    description: 'Do not skip directly to this break (Long or Mini)',
    withValue: false
  },
  duration: {
    long: '--duration',
    short: '-d',
    description: 'Specify duration for pausing breaks (Pause only) [indefinitely|until-morning|HHhMMm|HHh|MMm|MM]',
    withValue: true
  }
}

const allCommands = {
  help: {
    description: 'Show this help message'
  },
  version: {
    description: 'Show current stretchly version'
  },
  reset: {
    description: 'Reset breaks'
  },
  pause: {
    description: 'Pause breaks',
    options: [allOptions.duration]
  },
  resume: {
    description: 'Resume from a pause'
  },
  toggle: {
    description: 'Toggle breaks between resume/paused'
  },
  mini: {
    description: 'Skips to and customize next Mini Break',
    options: [allOptions.title, allOptions.noskip]
  },
  long: {
    description: 'Skips to and customize next Long Break',
    options: [allOptions.text, allOptions.title, allOptions.noskip]
  }
}

const allExamples = [{
  cmd: 'stretchly pause',
  description: 'Pause breaks indefinitely'
},
{
  cmd: 'stretchly pause -d 60',
  description: 'Pause breaks for one hour'
},
{
  cmd: 'stretchly pause -d 1h',
  description: 'Pause breaks for one hour'
},
{
  cmd: 'stretchly pause -d 1h20m',
  description: 'Pause breaks for one hour and twenty minutes'
},
{
  cmd: 'stretchly mini -T "Stretch up !"',
  description: 'Skips to next Mini Break with "Stretch up!" title'
},
{
  cmd: 'stretchly long -T "Stretch up !" --noskip',
  description: 'Sets next Break title to "Stretch up!"'
},
{
  cmd: 'stretchly long -T "Stretch up !" -t "Go stretch !"',
  description: 'Skips to next long break, sets title to "Stretch up !" and text to "Go stretch !"'
}]

// Parse cmd line, check if valid and put variables in a dedicated object
class Command {
  constructor (input, version) {
    this.version = version
    this.supported = allCommands

    this.parse(input)
  }

  parse (input) {
    // filter out electron flags first
    let i = 0
    while (i < input.length && input[i].startsWith('--')) {
      i++
    }

    const args = input.slice(i)
    this.command = args[0]

    if (this.command === undefined) {
      this.command = 'help'
    }

    if (!this.supported[this.command]) {
      console.error(`Error: command ${this.command} is not supported`)
      return
    }

    this.options = this.getOpts(args.slice(1))
  }

  getOpts (opts) {
    var options = {}

    if (!this.supported[this.command].options) {
      return null
    }

    for (let i = 0; i < opts.length; i++) {
      const name = opts[i]
      var valid = false

      this.supported[this.command].options.forEach(opt => {
        if (opt.long === name || opt.short === name) {
          valid = true
          if (opt.withValue) {
            options[opt.long.slice(2)] = opts[i + 1]
            i++
          } else {
            options[opt.long.slice(2)] = true
          }
        }
      })

      if (!valid) {
        log.error(`Error: options ${name} is not valid for command ${this.command}`)
      }
    }

    return options
  }

  runOrForward () {
    switch (this.command) {
      case 'help':
        this.help()
        break

      case 'version':
        this.ver()
        break

      default:
        console.log('Forwarding command to main instance')
    }
  }

  durationToMs (settings) {
    if (!this.options.duration) {
      return 1
    }

    switch (this.options.duration) {
      case 'indefinitely':
        return 1

      case 'until-morning':
        return new UntilMorning(settings).timeUntilMorning()

      default:
        return parseDuration(this.options.duration)
    }
  }

  checkInMain () {
    if (!this.command) {
      return false
    }

    if (this.command === 'version' || this.command === 'help') {
      return false
    }

    return true
  }

  ver () {
    console.log(`Stretchly version ${this.version}`)
  }

  cmdHelp () {
    var i = 0
    const options = '[options]'
    var part = `Usage: stretchly <command> ${options}\n\nCommands:`

    const cmds = Object.keys(this.supported).map(key => `${key}${this.supported[key].options === undefined ? '' : ` ${options}`}`)
    const longuest = cmds.reduce((acc, cur) => acc > cur.length ? acc : cur.length, 0)

    part = Object.keys(this.supported).reduce((acc, key) => {
      const padding = longuest - cmds[i].length
      var line = `stretchly ${cmds[i]}${' '.repeat(padding)} ${this.supported[key].description}`
      i++
      return `${acc}\n\t${line}`
    }, part)

    return part
  }

  optionsHelp () {
    var part = '\n\nOptions:'

    const longuest = Object.keys(allOptions).reduce((acc, key) => acc > allOptions[key].long.length ? acc : allOptions[key].long.length, 0)

    part = Object.keys(allOptions).reduce((acc, key) => {
      const opt = allOptions[key]
      const padding = longuest - opt.long.length
      var line = `${opt.short}, ${opt.long}${' '.repeat(padding)} ${opt.description}`
      return `${acc}\n\t${line}`
    }, part)

    return part
  }

  examplesHelp () {
    var part = '\n\nExamples:'

    const longuest = allExamples.reduce((acc, cur) => acc > cur.cmd.length ? acc : cur.cmd.length, 0)

    part = allExamples.reduce((acc, ex) => {
      const padding = longuest - ex.cmd.length
      var line = `${ex.cmd}${' '.repeat(padding)} ${ex.description}`
      return `${acc}\n\t${line}`
    }, part)

    return part
  }

  help () {
    console.log([this.cmdHelp(), this.optionsHelp(), this.examplesHelp()].join(''))
  }
}

// this function should return -1 if duration can't be parsed
function parseDuration (input) {
  if (input.match(/^\d+$/) != null) {
    const mins = Number.parseInt(input)
    return mins * minToMs
  }

  var result = input.toLowerCase().match(/(?:(\d+h))?(?:(\d+m))?/)
  if (result === null || result[0] === '') {
    return -1
  }

  const hours = result[1] ? Number.parseInt(result[1].slice(0, -1)) : 0
  const minutes = result[2] ? Number.parseInt(result[2].slice(0, -1)) : 0
  const total = hours * minToMs * 60 + minutes * minToMs

  return isNaN(total) ? -1 : total
}

const minToMs = 60000

module.exports = Command
