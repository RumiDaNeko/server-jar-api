/*
  Made by Aleksander Wegrzyn under the Code Credit License.
  Modified by setup.md to work in Cloudflare Workers
*/

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const VALID_SOFTWARES = ["vanilla", "bedrock", "paper", "waterfall", "velocity", "folia", "purpur", "mohistmc","fabric"];

async function handleRequest(request) {
  const { pathname, searchParams } = new URL(request.url);

  if (pathname === "/") {
    return Response.redirect("https://cloudcode.site", 301);
  }

  if (pathname.startsWith("/fetchJar/")) {
    const [, , software, version, build] = pathname.split("/");
    if (!VALID_SOFTWARES.includes(software)) {
      return new Response(JSON.stringify({ error: true, message: "Invalid software type." }), { status: 400 });
    }

    let versionToUse;
    switch (version) {
      case "latest":
        switch (software) {
          case "vanilla":
            versionToUse = await getLatestVanillaVersion();
            break;
          case "bedrock":
            versionToUse = await getLatestVanillaVersion();
            break;
          case "purpur":
            versionToUse = await getLatestPurpurVersion();
            break;
          case "paper":
            versionToUse = await getLatestPaperVersion();
            break;
          case "folia":
            versionToUse = await getLatestFoliaVersion();
            break;
          case "waterfall":
            versionToUse = await getLatestWaterfallVersion();
            break;
          case "velocity":
            versionToUse = await getLatestVelocityVersion();
            break;
          case "mohistmc":
            versionToUse = await getLatestMohistVersion();
            break;
          case "fabric":
            versionToUse = await getLatestFabricVersion();
            break;
        }
        break;
      default:
        versionToUse = version;
    }
    let url
    switch (software) {
      case "vanilla":
        url =  handleVanilla(versionToUse);
      case "bedrock":
        url = handleBedrock(versionToUse);
      case "purpur":
        url =  handlePurpur(versionToUse, build);
      case "paper":
        url =  handlePaper(versionToUse, build);
      case "waterfall":
        url =  handleWaterfall(versionToUse, build);
      case "folia":
        url =  handleFolia(versionToUse, build);
      case "velocity":
        url =  handleVelocity(versionToUse, build);
      case "mohistmc":
        url =  handleMohist(versionToUse);
      case "fabric":
        url =  handleFabric(versionToUse);
    }
    Response.redirect(url,302)
  }




 if (pathname.startsWith("/fetchAll/")) {
   const [, , software] = pathname.split("/");
    if (!VALID_SOFTWARES.includes(software)) {
      return new Response(JSON.stringify({ error: true, message: "Invalid software type." }), { status: 400 });
    }

   let softwaredata;
        switch (software) {
          case "vanilla":
            softwaredata = await getAllVanillaVersion();
            break;
          case "bedrock":
            softwaredata = await getAllVanillaVersion();
            break;
          case "purpur":
            softwaredata = await getAllPurpurVersion();
            break;
          case "paper":
            softwaredata = await getAllPaperVersion();
            break;
          case "folia":
            softwaredata = await getAllFoliaVersion();
            break;
          case "waterfall":
            softwaredata = await getAllWaterfallVersion();
            break;
          case "velocity":
            softwaredata = await getAllVelocityVersion();
            break;
          case "mohistmc":
            softwaredata = await getAllMohistVersion();
            break;
          case "fabric":
            softwaredata = await getAllFabricVersion();
            break;
        }

    return new Response(softwaredata, { status: 200 });
    }
    return new Response(null, { status: 404 });
}

async function getFileNameFromUrl(url) {
  const res = await fetch(url, { method: "HEAD" }); // HEAD only fetches headers, no body
  const disposition = res.headers.get("content-disposition");

  if (!disposition) return null;
  const match = disposition.match(/filename="?([^"]+)"?/);
  return match ? match[1] : null;
}
/* GET ALL*/

/* VANILLA */

async function getAllVanilaVersion() {
  const response = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
  const data = await response.json();
  const stableVersions = data.game.filter(v => v.type === "release");
  return stableVersions;
}

/* FABRIC */

async function getAllFabricVersion() {
  const response = await fetch("https://meta.fabricmc.net/v2/versions");
  const data = await response.json();
  const stableVersions = data.game.filter(v => v.stable === true);

  const loaderData = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${stableVersions[0].version}`);
    const loaderJson = await loaderData.json();

    if (!loaderJson.length) return new Response(JSON.stringify({ error: true, message: loaderData.error }), { status: 400 });;
    const loaderVersion = loaderJson[0].loader.version;
     const fabricsuitableInstallerData = await fetch(`https://meta.fabricmc.net/v2/versions/installer`).then(res => res.json());;
  if (fabricsuitableInstallerData.error) {
    return new Response(JSON.stringify({ error: true, message: fabricsuitableInstallerData.error }), { status: 400 });
  }
  const installerVersion = fabricsuitableInstallerData[0].version
  const result = [];
  for (const v of stableVersions) { // limit to 3 for speed
    let version = v.version
    console.log(version)
    const fileName = `fabric-server-mc.${version}-loader.${loaderVersion}-launcher.${installerVersion}.jar`;
    console.log(fileName)

    result.push({
      version: version,
      file: fileName || `${v.version}.jar`,
    });
  }

  return result;
}

/* PURPUR */

async function getAllPurpurVersion() {
  const response = await fetch("https://api.purpurmc.org/v2/purpur/");
  const data = await response.json();
  return data.versions;
}

/* PAPER */

async function getAllPaperVersion() {
  const response = await fetch("https://api.papermc.io/v2/projects/paper");
  const data = await response.json();
  return data.versions;
}

/* FOLIA */

async function getAllFoliaVersion() {
  const response = await fetch("https://api.papermc.io/v2/projects/folia");
  const data = await response.json();
  return data.versions;
}

/* MOHIST */

async function getAllMohistVersion() {
  const response = await fetch("https://mohistmc.com/api/versions");
  const versions = await response.json();
  return versions;
}

/* GET LATEST */

/* VANILLA */
async function getVersionManifest() {
  const response = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
  return await response.json();
}

async function getLatestVanillaVersion() {
  const versionManifest = await getVersionManifest();
  return versionManifest.latest.release;
}

/* BEDROCK 

This is still a WIP, due to worker limitations

*/

/* FABRIC */

async function getLatestFabricVersion() {
  const response = await fetch("https://meta.fabricmc.net/v2/versions");
  const data = await response.json();
  const stableVersions = data.game.filter(v => v.stable === true);
  return stableVersions[0];
}


/* PURPUR */

async function getLatestPurpurVersion() {
  const response = await fetch("https://api.purpurmc.org/v2/purpur/");
  const data = await response.json();
  return data.versions[data.versions.length - 1];
}

/* PAPER */

async function getLatestPaperVersion() {
  const response = await fetch("https://api.papermc.io/v2/projects/paper");
  const data = await response.json();
  return data.versions[data.versions.length - 1];
}

/* FOLIA */

async function getLatestFoliaVersion() {
  const response = await fetch("https://api.papermc.io/v2/projects/folia");
  const data = await response.json();
  return data.versions[data.versions.length - 1];
}


/* WATERFALL */

async function getLatestWaterfallVersion() {
  const response = await fetch("https://api.papermc.io/v2/projects/waterfall");
  const data = await response.json();
  return data.versions[data.versions.length - 1];
}

/* VELOCITY */

async function getLatestVelocityVersion() {
  const response = await fetch("https://api.papermc.io/v2/projects/velocity");
  const data = await response.json();
  return data.versions[data.versions.length - 1];
}

/* MOHIST */

async function getLatestMohistVersion() {
  const response = await fetch("https://mohistmc.com/api/versions");
  const versions = await response.json();
  return versions[versions.length - 1];
}

/* DOWNLOAD JAR */

/* VANILLA */
async function handleVanilla(version) {
  const versionManifest = await getVersionManifest();
  const vanillaVersion = versionManifest.versions.find(v => v.id === version);

  if (!vanillaVersion) {
    return new Response(JSON.stringify({ error: true, message: "Version not found." }), { status: 400 });
  }

  const response = await fetch(vanillaVersion.url);
  const data = await response.json();
  return data.downloads.server.url
}

/* BEDROCK 

async function handleBedrock(version) {
  const bedrockData = await fetch(`https://minecraft.azureedge.net/bin-linux/bedrock-server-${version}.zip`);

  if (bedrockData.error) {
    return new Response(JSON.stringify({ error: true, message: bedrockData.error }), { status: 400 });
  }

  return Response.redirect(bedrockData.url, 302);
}

*/

async function handleBedrock(version) {
  if (version.toLowerCase() === 'latest') {

    return new Response(JSON.stringify({ error: true, message: 'You cannot currently specify "latest" as a version number for Bedrock. Please specify an actual version number.' }), { status: 400 });

  } else {

    const bedrockDataResponse = await fetch(`https://minecraft.azureedge.net/bin-linux/bedrock-server-${version}.zip`);

    if (!bedrockDataResponse.ok) {

      return new Response(JSON.stringify({ error: true, message: 'Please specify a valid build number for Bedrock edition.' }), { status: 404 });
    }

    return bedrockDataResponse.url
  }
}


/* FABRIC */

async function handleFabric(version) {
  const fabricsuitableloaderData = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`).then(res => res.json());;
    if (fabricsuitableloaderData.error) {
    return new Response(JSON.stringify({ error: true, message: fabricsuitableloaderData.error }), { status: 400 });
  }
  const fabricsuitableloader = fabricsuitableloaderData[0].loader.version
  const fabricsuitableInstallerData = await fetch(`https://meta.fabricmc.net/v2/versions/installer`).then(res => res.json());;
  if (fabricsuitableInstallerData.error) {
    return new Response(JSON.stringify({ error: true, message: fabricsuitableInstallerData.error }), { status: 400 });
  }
  const fabricsuitableInstaller = fabricsuitableInstallerData[0].version

  const FabricRedir = `https://meta.fabricmc.net/v2/versions/${version}/${fabricsuitableloader}/${fabricsuitableInstaller}/server/jar`;

  return FabricRedir
}

/* PURPUR */

async function handlePurpur(version, build) {
  if (!build) {
    return new Response(JSON.stringify({ error: true, message: "Build parameter is required for Purpur." }), { status: 400 });
  }

  const purpurData = await fetch(`https://api.purpurmc.org/v2/purpur/${version}/${build}`).then(res => res.json());;
  if (purpurData.error) {
    return new Response(JSON.stringify({ error: true, message: purpurData.error }), { status: 400 });
  }

  const purpurRedir = `https://api.purpurmc.org/v2/purpur/${version}/${build}/download`;

  return purpurRedir
}

/* PAPER */

async function handlePaper(version, build) {
  const paperBuilds = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds`).then(res => res.json());

  if (paperBuilds.error) {
    return new Response(JSON.stringify({ error: true, message: paperBuilds.error }), { status: 400 });
  }

  let finalBuild;
  if (build === "latest") {
    finalBuild = paperBuilds.builds[paperBuilds.builds.length - 1];
  } else {
    finalBuild = paperBuilds.builds.find(b => b.build === build);
    if (!finalBuild) {
      return new Response(JSON.stringify({ error: true, message: "Invalid build." }), { status: 400 });
    }
  }

  let filename = finalBuild.downloads.application.name;
  return `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${finalBuild.build}/downloads/${filename}`
}

/* FOLIA */

async function handleFolia(version, build) {
  const foliaBuilds = await fetch(`https://api.papermc.io/v2/projects/folia/versions/${version}/builds`).then(res => res.json());

  if (foliaBuilds.error) {
    return new Response(JSON.stringify({ error: true, message: foliaBuilds.error }), { status: 400 });
  }

  let finalBuild;
  if (build === "latest") {
    finalBuild = foliaBuilds.builds[foliaBuilds.builds.length - 1];
  } else {
    finalBuild = foliaBuilds.builds.find(b => b.build === build);
    if (!finalBuild) {
      return new Response(JSON.stringify({ error: true, message: "Invalid build." }), { status: 400 });
    }
  }

  let filename = finalBuild.downloads.application.name;
  return `https://api.papermc.io/v2/projects/folia/versions/${version}/builds/${finalBuild.build}/downloads/${filename}`
}

/* WATERFALL */

async function handleWaterfall(version, build) {
  const waterfallBuilds = await fetch(`https://api.papermc.io/v2/projects/waterfall/versions/${version}/builds`).then(res => res.json());

  if (waterfallBuilds.error) {
    return new Response(JSON.stringify({ error: true, message: waterfallBuilds.error }), { status: 400 });
  }

  let finalBuild;
  if (build === "latest") {
    finalBuild = waterfallBuilds.builds[waterfallBuilds.builds.length - 1];
  } else {
    finalBuild = waterfallBuilds.builds.find(b => b.build === build);
    if (!finalBuild) {
      return new Response(JSON.stringify({ error: true, message: "Invalid build." }), { status: 400 });
    }
  }

  let filename = finalBuild.downloads.application.name;
  return `https://api.papermc.io/v2/projects/waterfall/versions/${version}/builds/${finalBuild.build}/downloads/${filename}`
}

/* VELOCITY */

async function handleVelocity(version, build) {
  const velocityBuilds = await fetch(`https://api.papermc.io/v2/projects/velocity/versions/${version}/builds`).then(res => res.json());

  if (velocityBuilds.error) {
    return new Response(JSON.stringify({ error: true, message: velocityBuilds.error }), { status: 400 });
  }

  let finalBuild;
  if (build === "latest") {
    finalBuild = velocityBuilds.builds[velocityBuilds.builds.length - 1];
  } else {
    finalBuild = velocityBuilds.builds.find(b => b.build === build);
    if (!finalBuild) {
      return new Response(JSON.stringify({ error: true, message: "Invalid build." }), { status: 400 });
    }
  }

  let filename = finalBuild.downloads.application.name;
  return `https://api.papermc.io/v2/projects/velocity/versions/${version}/builds/${finalBuild.build}/downloads/${filename}`
}

/* MOHIST */

async function handleMohist(version) {
  const mohistData = await fetch(`https://mohistmc.com/api/${version}/latest`).then(res => res.json());

  if (mohistData.error) {
    return new Response(JSON.stringify({ error: true, message: mohistData.error }), { status: 400 });
  }

  return mohistData.url
}
