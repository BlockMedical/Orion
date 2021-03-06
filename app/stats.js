import Mixpanel from 'mixpanel'
import Settings from 'electron-settings'
import uuidv4 from 'uuid/v4'
import pjson from '../package.json'
import { release, platform } from 'os'

const SettingsUserIDKey = 'statsUserID'

const client = Mixpanel.init(pjson.statsToken, {
  protocol: 'https'
})

let UserID = Settings.get(SettingsUserIDKey)

/*
 * setUpUser will configure the client in order to track errors, events and
 * follow users when debugging process.
 */
export function setUpUser () {
  if (!Settings.get(SettingsUserIDKey)) {
    UserID = uuidv4()
    Settings.set(SettingsUserIDKey, UserID)
  }

  UserID = Settings.get(SettingsUserIDKey)
  client.people.set(UserID, {
    $name: UserID,
    version: `${pjson.version}`,
    os_release: `${release()}`,
    os_platform: `${platform()}`
  })
}

/*
 * trackEvent will send a new event with specific data. It will get the user
 * IP address, add/updates the platform, version, release to the profile and
 * then track the event.
 *
 * It returns a Promise
 */
export function trackEvent (eventName, data) {
  return new Promise((resolve, reject) => {
    const allowUserTracking = Settings.get('allowUserTracking')
    if (!allowUserTracking) {
      return resolve()
    }

    setUpUser()
    if (!data) {
      data = {}
    }

    data.distinct_id = UserID
    data.version = `${pjson.version}`
    client.track(eventName, data, (err) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}
