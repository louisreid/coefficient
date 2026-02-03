import { buildStoragePath } from "../storage";

describe("fieldVideo storage", () => {
  describe("buildStoragePath", () => {
    it("builds path with classId, captureId, type and ext", () => {
      expect(
        buildStoragePath("class-1", "cap-abc", "photo", "jpg")
      ).toBe("class-1/cap-abc-photo.jpg");
    });

    it("supports thumb and video types", () => {
      expect(
        buildStoragePath("c1", "cap-1", "thumb", "jpg")
      ).toBe("c1/cap-1-thumb.jpg");
      expect(
        buildStoragePath("c1", "cap-1", "video", "mp4")
      ).toBe("c1/cap-1-video.mp4");
    });
  });
});
