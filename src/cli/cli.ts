"use strict";
import stream from "node:stream";
import { bold, greenBright } from "colorette";

const axios = require("axios");
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv))
  .required("apiKey", "API Key is required")
  .required("template", "Template is required")
  .boolean("no-cache")
  .boolean("overwrite")
  .boolean("debug").argv;

interface KeyValueData {
  [key: string]: string;
}

const EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "pdf",
  "webp",
  "gif",
  "bmp",
  "tiff",
  "eps",
];

const execute = async () => {
  const directory = argv._[argv._.length - 1];
  if (!directory) {
    console.log("No directory provided");
    return;
  }

  if (argv.debug) {
    console.log(bold("Directory: ") + path.resolve(directory));
  }
  const filePaths = glob.sync(directory + "/**/*.json");

  for (const filePath of filePaths) {
    await processJsonFile(filePath);
  }
};

const processJsonFile = async (filePath: string) => {
  const fileRaw = fs.readFileSync(filePath, "utf8");
  const jsonFile = JSON.parse(fileRaw);

  const isRenderFormFile = jsonFile?.renderform || false;
  if (!isRenderFormFile) {
    return;
  }
  const jsonFileName = path.parse(filePath).name;
  const fileDirectory = path.parse(filePath).dir;
  const canOverwrite = argv.overwrite;
  if (!canOverwrite) {
    for (const extension of EXTENSIONS) {
      const outputPath = path.join(
        path.dirname(filePath),
        jsonFileName + "." + extension
      );
      if (fs.existsSync(outputPath)) {
        console.log(
          `${bold(
            "Skipping:"
          )} ${jsonFileName}.${extension} already exists. Use ${bold(
            "--overwrite"
          )} to overwrite existing files.`
        );
        return;
      }
    }
  }
  process.stdout.write(greenBright("Render: ") + filePath);
  const template = argv.template;
  const templatePropertyValues = jsonFile.data;

  if (argv.debug) {
    console.log("Template: " + template);
    console.log("Data: " + JSON.stringify(templatePropertyValues));
  }

  const imageUrl = await renderImage(template, templatePropertyValues);
  const imageData = await downloadImage(imageUrl);
  const imageFileExtension = path.extname(imageUrl);
  const savePath = fileDirectory + "/" + jsonFileName + imageFileExtension;
  await saveImage(imageData, savePath);
  process.stdout.write(" -> " + savePath);
  console.log("");
};

const downloadImage = async (imageUrl): Promise<any> => {
  const responseImage = await axios.get(imageUrl, { responseType: "stream" });
  return responseImage.data;
};

const saveImage = async (imageData: stream, outputPath: string) => {
  return new Promise<void>((resolve, reject) => {
    imageData
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => resolve())
      .on("error", (e) => reject(e));
  });
};

const renderImage = async (
  template: string,
  data: KeyValueData
): Promise<string> => {
  const requestBody = {
    template,
    data,
  };

  if (!argv.cache) {
    requestBody["version"] = Date.now();
  }
  const headers = {
    "content-type": "application/json",
    "x-api-key": argv.apiKey,
  };

  if (argv.debug) {
    console.log("Headers: " + JSON.stringify(headers));
    console.log("Request Body: " + JSON.stringify(requestBody));
  }

  const responseRender = await axios.post(
    "https://get.renderform.io/api/v2/render",
    requestBody,
    { headers }
  );

  if (argv.debug) {
    console.log("Response: " + JSON.stringify(responseRender.data));
  }

  return responseRender.data.href;
};

(async () => {
  try {
    await execute();
    console.log(greenBright("Finished!"));
    process.exit(0);
  } catch (e) {
    console.log("");
    console.log(e.message);
    const data = e?.response?.data || "";
    if (data) {
      console.log(data);
    }
    process.exit(1);
  }
})();
