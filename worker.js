addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const VALID_SOFTWARES = ["vanilla", "bedrock", "paper", "purpur", "mohistmc"];

async function handleRequest(request) {
  const { pathname, searchParams } = new URL(request.url);

  if (pathname === "/") {
    return Response.redirect("https://setup.md/service/jar-api", 301);
  }

  if (pathname.startsWith("/download/")) {
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
            versionToUse = await getLatestBedrockVersion();
            break;
          case "purpur":
            versionToUse = await getLatestPurpurVersion();
            break;
          case "paper":
            versionToUse = await getLatestPaperVersion();
            break;
          case "mohistmc":
            versionToUse = await getLatestMohistVersion();
            break;
        }
        break;
      default:
        versionToUse = version;
    }

    switch (software) {
      case "vanilla":
        return handleVanilla(versionToUse);
      case "bedrock":
        return handleBedrock(versionToUse);
      case "purpur":
        return handlePurpur(versionToUse, build);
      case "paper":
        return handlePaper(versionToUse, build);
      case "mohistmc":
        return handleMohist(versionToUse);
    }
  }

  return new Response(null, { status: 404 });
}

/* VANILLA */
async function getVersionManifest() {
  const response = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
  return await response.json();
}

async function getLatestVanillaVersion() {
  const versionManifest = await getVersionManifest();
  return versionManifest.latest.release;
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
  return Response.redirect(data.downloads.server.url, 302);
}

/* BEDROCK */

async function handleBedrock(version) {
  const bedrockData = await fetch(`https://minecraft.azureedge.net/bin-linux/bedrock-server-${version}.zip`);

  if (bedrockData.error) {
    return new Response(JSON.stringify({ error: true, message: bedrockData.error }), { status: 400 });
  }

  return Response.redirect(bedrockData.url, 302);
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

  return Response.redirect(purpurRedir, 302);
}



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
  return Response.redirect(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${finalBuild.build}/downloads/${filename}`, 302);
}

async function handleMohist(version) {
  const mohistData = await fetch(`https://mohistmc.com/api/${version}/latest`).then(res => res.json());

  if (mohistData.error) {
    return new Response(JSON.stringify({ error: true, message: mohistData.error }), { status: 400 });
  }

  return Response.redirect(mohistData.url, 302);
}
