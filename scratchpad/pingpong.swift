import AVFoundation
import CoreImage
// pingpong.swift <in.mp4> <out.mp4> <bitrate> <cycleSeconds>
// Plays the clip forward then backward, so the loop point is the same frame on
// both sides: no cut, however many times it repeats. Inputs are short (~5s).
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let out = URL(fileURLWithPath: a[2]); try? FileManager.default.removeItem(at: out)
let br = Int(a[3])!
let track = asset.tracks(withMediaType: .video).first!
let reader = try! AVAssetReader(asset: asset)
let rOut = AVAssetReaderTrackOutput(track: track, outputSettings:
  [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
rOut.alwaysCopiesSampleData = true
reader.add(rOut); reader.startReading()
var frames: [(CVPixelBuffer, CMSampleBuffer)] = []
while let sb = rOut.copyNextSampleBuffer() {
  if let pb = CMSampleBufferGetImageBuffer(sb) { frames.append((pb, sb)) }
}
let n = frames.count
let fps = Double(track.nominalFrameRate)
let dt = CMTime(seconds: 1.0 / fps, preferredTimescale: 6000)
// One full there-and-back cycle in T seconds. Position follows a raised cosine,
// so the drone slows to a stop at each end instead of reversing at full speed
// (a straight ping-pong bounces). Fractional positions blend the two nearest
// frames, which keeps the slow ends smooth instead of stepping.
let T = Double(a[4])!
let total = Int((T * fps).rounded())
let ci = CIContext()

let size = track.naturalSize
let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let wIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: Int(size.width), AVVideoHeightKey: Int(size.height),
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: br,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: 60, AVVideoAllowFrameReorderingKey: true]])
wIn.expectsMediaDataInRealTime = false
let ad = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: wIn, sourcePixelBufferAttributes: nil)
writer.add(wIn); writer.startWriting(); writer.startSession(atSourceTime: .zero)
var i = 0
let blend = CIFilter(name: "CIDissolveTransition")!
let sem = DispatchSemaphore(value: 0)
wIn.requestMediaDataWhenReady(on: DispatchQueue(label: "p")) {
  while wIn.isReadyForMoreMediaData {
    if i >= total { wIn.markAsFinished(); sem.signal(); return }
    let pos = (1 - cos(2 * Double.pi * Double(i) / Double(total))) / 2 * Double(n - 1)
    let f = min(Int(pos), n - 2), al = pos - Double(f)
    var pb: CVPixelBuffer? = nil
    CVPixelBufferPoolCreatePixelBuffer(nil, ad.pixelBufferPool!, &pb)
    blend.setValue(CIImage(cvPixelBuffer: frames[f].0), forKey: kCIInputImageKey)
    blend.setValue(CIImage(cvPixelBuffer: frames[f + 1].0), forKey: kCIInputTargetImageKey)
    blend.setValue(al, forKey: kCIInputTimeKey)
    ci.render(blend.outputImage!, to: pb!)
    ad.append(pb!, withPresentationTime: CMTimeMultiply(dt, multiplier: Int32(i)))
    i += 1
  }
}
sem.wait(); writer.finishWriting {}
while writer.status == .writing { Thread.sleep(forTimeInterval: 0.05) }
let sz = (try! FileManager.default.attributesOfItem(atPath: out.path)[.size] as! Int)
print(String(format: "frames %d  %.2fs  %d KB", total, CMTimeGetSeconds(AVURLAsset(url: out).duration), sz/1024))
