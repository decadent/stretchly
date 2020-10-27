const chai = require('chai')
const Command = require('../app/utils/commands')

chai.should()

describe('commands', () => {
  it('should parse a valid simple command', () => {
    const input = ['help']
    const cmd = new Command(input, '1.2.3')
    cmd.command.should.be.equal('help')
  })

  it('should return help when there is no commmand', () => {
    const input = []
    const cmd = new Command(input, '1.2.3')
    cmd.command.should.be.equal('help')
  })

  it('should parse a more complex command', () => {
    const input = ['pause', '-d', 'until-morning']
    const cmd = new Command(input, '1.2.3')
    cmd.command.should.be.equal('pause')
    cmd.options.duration.should.be.equal('until-morning')
  })

  it('should drop all flags before command', () => {
    const input = ['--some-electron-flag=value', 'mini', '-T', 'test', '--noskip']
    const cmd = new Command(input, '1.2.3')
    cmd.command.should.be.equal('mini')
    cmd.options.title.should.be.equal('test')
  })

  it('should get options from a command', () => {
    const opts = ['-T', 'test', '-n']
    const cmd = new Command(['mini'], '1.2.3')
    const options = cmd.getOpts(opts)
    options.title.should.be.equal('test')
    options.noskip.should.be.equal(true)
  })

  it('should parse a duration from args', () => {
    const input = ['pause', '-d', '60m']
    const cmd = new Command(input, '1.2.3')
    cmd.durationToMs(null).should.be.equal(3600000)
  })

  it('should return -1 if duration not formated correcly', () => {
    const input = ['pause', '-d', '10i20k']
    const cmd = new Command(input, '1.2.3')
    cmd.durationToMs(null).should.be.equal(-1)
  })
})
