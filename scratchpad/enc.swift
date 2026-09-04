import AVFoundation
// enc.swift <in> <out.mp4> <start> <end> <w> <h> <bitrate>
// AVAssetReaderTrackOutput — NOT AVAssetReaderVideoCompositionOutput. The
// composition path remapped time and produced the wrong 4s of material; the
// plain track output keeps asset timestamps, which is what timeRange means.
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let out = URL(fileURLWithPath: a[2]); try? FileManager.default.removeItem(at: out)
let start = CMTime(seconds: Double(a[3])!, preferredTimescale: 600)
let end = CMTime(seconds: Double(a[4])!, preferredTimescale: 600)
let W = Int(a[5])!, H = Int(a[6])!, br = Int(a[7])!
let track = asset.tracks(withMediaType: .video).first!

let reader = try! AVAssetReader(asset: asset)
reader.timeRange = CMTimeRange(start: start, end: end)
let rOut = AVAssetReaderTrackOutput(track: track, outputSettings:
  [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
rOut.alwaysCopiesSampleData = false
reader.add(rOut)

let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let wIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: br,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: 90, AVVideoAllowFrameReorderingKey: true]])
wIn.expectsMediaDataInRealTime = false
wIn.transform = track.preferredTransform
let ad = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: wIn, sourcePixelBufferAttributes: nil)
writer.add(wIn)
writer.startWriting(); reader.startReading(); writer.startSession(atSourceTime: .zero)

let sem = DispatchSemaphore(value: 0); var n = 0
wIn.requestMediaDataWhenReady(on: DispatchQueue(label: "e")) {
  while wIn.isReadyForMoreMediaData {
    guard let sb = rOut.copyNextSampleBuffer() else { wIn.markAsFinished(); sem.signal(); return }
    let t = CMTimeSubtract(CMSampleBufferGetPresentationTimeStamp(sb), start)
    if let pb = CMSampleBufferGetImageBuffer(sb) { ad.append(pb, withPresentationTime: t); n += 1 }
  }
}
sem.wait(); writer.finishWriting {}
while writer.status == .writing { Thread.sleep(forTimeInterval: 0.05) }
let sz = (try! FileManager.default.attributesOfItem(atPath: out.path)[.size] as! Int)
let d = CMTimeGetSeconds(AVURLAsset(url: out).duration)
print(String(format: "frames %d  %.2fs  %d KB", n, d, sz/1024))
