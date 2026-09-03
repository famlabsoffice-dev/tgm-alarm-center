const { withProjectBuildGradle } = require('expo/config-plugins');

const KOTLIN_VERSION = '2.0.21';
const MARKER = 'TGM_KOTLIN_STDLIB_RESOLUTION';

module.exports = function withKotlinStdlibResolution(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error('TGM Kotlin resolution plugin requires a Groovy Android project build.gradle.');
    }

    const resolutionBlock = `// ${MARKER}\nallprojects {\n  configurations.all {\n    resolutionStrategy.force(\n      'org.jetbrains.kotlin:kotlin-stdlib:${KOTLIN_VERSION}',\n      'org.jetbrains.kotlin:kotlin-stdlib-jdk7:${KOTLIN_VERSION}',\n      'org.jetbrains.kotlin:kotlin-stdlib-jdk8:${KOTLIN_VERSION}',\n      'org.jetbrains.kotlin:kotlin-reflect:${KOTLIN_VERSION}'\n    )\n  }\n}\n`;

    if (!modConfig.modResults.contents.includes(MARKER)) {
      modConfig.modResults.contents = `${resolutionBlock}\n${modConfig.modResults.contents}`;
    }

    return modConfig;
  });
};
