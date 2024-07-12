/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GoogleAIFileManager,
  FileState,
  GoogleAICacheManager,
} from "@google/generative-ai/server";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mediaPath = __dirname + "/media";

async function tokensTextOnly() {
  // [START tokens_text_only]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  // Count tokens in a prompt without calling text generation.
  const countResult = await model.countTokens(
    "The quick brown fox jumps over the lazy dog.",
  );

  console.log(countResult.totalTokens); // 11
  console.log(countResult.contentTokens[0]);
  // { partTokens: [ 10 ], roleTokens: 1 }

  const generateResult = await model.generateContent(
    "The quick brown fox jumps over the lazy dog.",
  );

  // On the response for `generateContent`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(generateResult.response.usageMetadata);
  // { promptTokenCount: 11, candidatesTokenCount: 131, totalTokenCount: 142 }
  // [END tokens_text_only]
}

async function tokensChat() {
  // [START tokens_chat]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hi my name is Bob" }],
      },
      {
        role: "model",
        parts: [{ text: "Hi Bob!" }],
      },
    ],
  });

  const countResult = await model.countTokens({
    generateContentRequest: { contents: await chat.getHistory() },
  });
  console.log(countResult.totalTokens); // 10

  const chatResult = await chat.sendMessage(
    "In one sentence, explain how a computer works to a young child.",
  );

  // On the response for `sendMessage`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(chatResult.response.usageMetadata);
  // { promptTokenCount: 25, candidatesTokenCount: 22, totalTokenCount: 47 }
  // [END tokens_chat]
}

async function tokensMultimodalImageInline() {
  // [START tokens_multimodal_image_inline]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  function fileToGenerativePart(path, mimeType) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString("base64"),
        mimeType,
      },
    };
  }

  const imagePart = fileToGenerativePart(
    `${mediaPath}/jetpack.jpg`,
    "image/jpeg",
  );

  const prompt = "Tell me about this image.";

  // Call `countTokens` to get the input token count
  // of the combined text and file (`totalTokens`).
  // An image's display or file size does not affect its token count.
  // Optionally, you can call `countTokens` for the text and file separately.
  const countResult = await model.countTokens([prompt, imagePart]);
  console.log(countResult.totalTokens); // 265

  const generateResult = await model.generateContent([prompt, imagePart]);

  // On the response for `generateContent`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(generateResult.response.usageMetadata);
  // { promptTokenCount: 265, candidatesTokenCount: 157, totalTokenCount: 422 }
  // [END tokens_multimodal_image_inline]
}

async function tokensMultimodalImageFileApi() {
  // [START tokens_multimodal_image_file_api]
  // Make sure to include these imports:
  // import { GoogleAIFileManager } from "@google/generative-ai/server";
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadResult = await fileManager.uploadFile(
    `${mediaPath}/jetpack.jpg`,
    { mimeType: "image/jpeg" },
  );

  const imagePart = {
    fileData: {
      fileUri: uploadResult.file.uri,
      mimeType: uploadResult.file.mimeType,
    },
  };

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = "Tell me about this image.";

  // Call `countTokens` to get the input token count
  // of the combined text and file (`totalTokens`).
  // An image's display or file size does not affect its token count.
  // Optionally, you can call `countTokens` for the text and file separately.
  const countResult = await model.countTokens([prompt, imagePart]);

  console.log(countResult.totalTokens); // 265

  const generateResult = await model.generateContent([prompt, imagePart]);

  // On the response for `generateContent`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(generateResult.response.usageMetadata);
  // { promptTokenCount: 265, candidatesTokenCount: 157, totalTokenCount: 422 }
  // [END tokens_multimodal_image_file_api]
  await fileManager.deleteFile(uploadResult.file.name);
}

async function tokensMultimodalVideoAudioFileApi() {
  // [START tokens_multimodal_video_audio_file_api]
  // Make sure to include these imports:
  // import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadVideoResult = await fileManager.uploadFile(
    `${mediaPath}/Big_Buck_Bunny.mp4`,
    { mimeType: "video/mp4" },
  );

  let file = await fileManager.getFile(uploadVideoResult.file.name);
  process.stdout.write("processing video");
  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".");
    // Sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    // Fetch the file from the API again
    file = await fileManager.getFile(uploadVideoResult.file.name);
  }

  if (file.state === FileState.FAILED) {
    throw new Error("Video processing failed.");
  } else {
    process.stdout.write("\n");
  }

  const videoPart = {
    fileData: {
      fileUri: uploadVideoResult.file.uri,
      mimeType: uploadVideoResult.file.mimeType,
    },
  };

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = "Tell me about this video.";

  // Call `countTokens` to get the input token count
  // of the combined text and file (`totalTokens`).
  // An video or audio file's display or file size does not affect its token count.
  // Optionally, you can call `countTokens` for the text and file separately.
  const countResult = await model.countTokens([prompt, videoPart]);

  console.log(countResult.totalTokens); // 302

  const generateResult = await model.generateContent([prompt, videoPart]);

  // On the response for `generateContent`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(generateResult.response.usageMetadata);
  // { promptTokenCount: 302, candidatesTokenCount: 46, totalTokenCount: 348 }
  // [END tokens_multimodal_video_audio_file_api]
  await fileManager.deleteFile(uploadVideoResult.file.name);
}

async function tokensCachedContent() {
  // [START tokens_cached_content]
  // Make sure to include these imports:
  // import { GoogleAIFileManager, GoogleAICacheManager } from "@google/generative-ai/server";
  // import { GoogleGenerativeAI } from "@google/generative-ai";

  // Upload large text file.
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);
  const uploadResult = await fileManager.uploadFile(`${mediaPath}/a11.txt`, {
    mimeType: "text/plain",
  });

  // Create a cache that uses the uploaded file.
  const cacheManager = new GoogleAICacheManager(process.env.API_KEY);
  const cacheResult = await cacheManager.create({
    ttlSeconds: 600,
    model: "models/gemini-1.5-flash-001",
    contents: [
      {
        role: "user",
        parts: [{ text: "Here's the Apollo 11 transcript:" }],
      },
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: uploadResult.file.mimeType,
            },
          },
        ],
      },
    ],
  });

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash",
  });

  // Call `countTokens` to get the input token count
  // of the combined text and file (`totalTokens`).
  const result = await model.countTokens({
    generateContentRequest: {
      contents: [
        {
          role: "user",
          parts: [{ text: "Please give a short summary of this file." }],
        },
      ],
      cachedContent: cacheResult.name,
    },
  });

  console.log(result.totalTokens); // 10

  const generateResult = await model.generateContent(
    "Please give a short summary of this file.",
  );

  // On the response for `generateContent`, use `usageMetadata`
  // to get separate input and output token counts
  // (`promptTokenCount` and `candidatesTokenCount`, respectively),
  // as well as the combined token count (`totalTokenCount`).
  console.log(generateResult.response.usageMetadata);
  // { promptTokenCount: 10, candidatesTokenCount: 31, totalTokenCount: 41 }

  await cacheManager.delete(cacheResult.name);
  // [END tokens_cached_content]
}

async function tokensSystemInstruction() {
  // [START tokens_system_instruction]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash",
  });

  const result = await model.countTokens({
    generateContentRequest: {
      contents: [
        {
          role: "user",
          parts: [{ text: "The quick brown fox jumps over the lazy dog." }],
        },
      ],
      systemInstruction: {
        role: "system",
        parts: [{ text: "You are a cat. Your name is Neko." }],
      },
    },
  });

  console.log(result);
  // {
  //   totalTokens: 23,
  //   systemInstructionsTokens: { partTokens: [ 11 ], roleTokens: 1 },
  //   contentTokens: [ { partTokens: [Array], roleTokens: 1 } ]
  // }
  // [END tokens_system_instruction]
}

async function tokensTools() {
  // [START tokens_tools]
  // Make sure to include these imports:
  // import { GoogleGenerativeAI } from "@google/generative-ai";
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash",
  });

  const functionDeclarations = [
    { name: "add" },
    { name: "subtract" },
    { name: "multiply" },
    { name: "divide" },
  ];

  const result = await model.countTokens({
    generateContentRequest: {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "I have 57 cats, each owns 44 mittens, how many mittens is that in total?",
            },
          ],
        },
      ],
      tools: [{ functionDeclarations }],
    },
  });

  console.log(result);
  // {
  //   totalTokens: 99,
  //   systemInstructionsTokens: {},
  //   contentTokens: [ { partTokens: [Array], roleTokens: 1 } ],
  //   toolTokens: [ { functionDeclarationTokens: [Array] } ]
  // }
  // [END tokens_tools]
}

async function runAll() {
  // Comment out or delete any sample cases you don't want to run.
  await tokensTextOnly();
  await tokensChat();
  await tokensMultimodalImageInline();
  await tokensMultimodalImageFileApi();
  await tokensMultimodalVideoAudioFileApi();
  await tokensCachedContent();
  await tokensSystemInstruction();
  await tokensTools();
}

runAll();
