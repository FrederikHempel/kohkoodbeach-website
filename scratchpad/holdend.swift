import AVFoundation
import CoreImage
// holdend.swift <in> <out.mp4> <bitrate> <w> <h> <endSeconds> <tailSeconds>
// Plays the source once at its own speed from 0 to <endSeconds>, easing to a stop
// over the last <tailSeconds> of OUTPUT time (velocity falls linearly to zero), so
// the held last frame does not look like a drone that hit a wall. Streams the
// source (4K frames cannot all be held in memory) and blends the two nearest
// frames at fractional positions, which keeps the slow tail smooth.
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let out = URL(fileURLWithPath: a[2]); try? FileManager.default.removeItem(at: out)
let br = Int(a[3])!, W = Int(a[4])!, H = Int(a[5])!
let D = Double(a[6])!, tau = Double(a[7])!
let track = asset.tracks(withMediaType: .video).first!
let fps = Double(track.nominalFrameRate)
let t0 = D - tau / 2
let T = t0 + tau
let total = Int((T * fps).rounded())

let reader = try! AVAssetReader(asset: asset)
reader.timeRange = CMTimeRange(start: .zero, duration: CMTime(seconds: D + 0.5, preferredTimescale: 600))
let rOut = AVAssetReaderTrackOutput(track: track, outputSettings: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
  kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H])
rOut.alwaysCopiesSampleData = true
reader.add(rOut); reader.startReading()

var idx = 0                       // index of `cur`
var cur: CVPixelBuffer? = nil
var nxt: CVPixelBuffer? = nil
func advance() {                  // move the window one frame forward
  cur = nxt; idx += 1
  if let sb = rOut.copyNextSampleBuffer() { nxt = CMSampleBufferGetImageBuffer(sb) } else { nxt = cur }
}
// prime the window: cur = frame 0, nxt = frame 1
cur = CMSampleBufferGetImageBuffer(rOut.copyNextSampleBuffer()!)
nxt = CMSampleBufferGetImageBuffer(rOut.copyNextSampleBuffer()!)
idx = 0

let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let wIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: br,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: 60, AVVideoAllowFrameReorderingKey: true]])
wIn.expectsMediaDataInRealTime = false
let ad = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: wIn, sourcePixelBufferAttributes: nil)
writer.add(wIn); writer.startWriting(); writer.startSession(atSourceTime: .zero)
let ci = CIContext()
let blend = CIFilter(name: "CIDissolveTransition")!
let dt = CMTime(seconds: 1.0 / fps, preferredTimescale: 6000)
var i = 0
let sem = DispatchSemaphore(value: 0)
wIn.requestMediaDataWhenReady(on: DispatchQueue(label: "h")) {
  while wIn.isReadyForMoreMediaData {
    if i >= total { wIn.markAsFinished(); sem.signal(); return }
    let t = Double(i) / fps
    let s = t <= t0 ? t : t0 + (t - t0) - (t - t0) * (t - t0) / (2 * tau)   // source seconds
    let pos = s * fps
    let f = Int(pos), al = pos - Double(f)
    while idx < f { advance() }
    var pb: CVPixelBuffer? = nil
    CVPixelBufferPoolCreatePixelBuffer(nil, ad.pixelBufferPool!, &pb)
    blend.setValue(CIImage(cvPixelBuffer: cur!), forKey: kCIInputImageKey)
    blend.setValue(CIImage(cvPixelBuffer: nxt!), forKey: kCIInputTargetImageKey)
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
