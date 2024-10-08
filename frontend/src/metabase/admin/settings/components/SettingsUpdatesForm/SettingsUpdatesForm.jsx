import cx from "classnames";
import PropTypes from "prop-types";

import { UpsellHostingUpdates } from "metabase/admin/upsells";
import { useSetting } from "metabase/common/hooks";
import CS from "metabase/css/core/index.css";
import { Flex } from "metabase/ui";

import { SettingsSetting } from "../SettingsSetting";

import { VersionUpdateNotice } from "./VersionUpdateNotice/VersionUpdateNotice";
export default function SettingsUpdatesForm({ elements, updateSetting }) {
  const settings = elements.map((setting, index) => (
    <SettingsSetting
      key={setting.key}
      setting={setting}
      onChange={value => updateSetting(setting, value)}
      autoFocus={index === 0}
    />
  ));
  const isHosted = useSetting("is-hosted");

  return (
    <Flex justify="space-between">
      <div style={{ width: "585px" }}>
        {!isHosted && <ul>{settings}</ul>}

        <div className={CS.px2}>
          <div
            className={cx(CS.pt3, {
              [CS.borderTop]: !isHosted,
            })}
          >
            <VersionUpdateNotice />
          </div>
        </div>
      </div>
      <div>
        <UpsellHostingUpdates source="settings-updates-migrate_to_cloud" />
      </div>
    </Flex>
  );
}

SettingsUpdatesForm.propTypes = {
  elements: PropTypes.array,
  updateSetting: PropTypes.func,
};
