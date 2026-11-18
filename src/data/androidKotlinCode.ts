export interface AndroidCodeFile {
  id: string;
  title: string;
  urduTitle: string;
  filePath: string;
  language: 'kotlin' | 'gradle' | 'text';
  summary: string;
  code: string;
}

export const ANDROID_KOTLIN_FILES: AndroidCodeFile[] = [
  {
    id: 'structure-gradle',
    title: '01. Project Structure & build.gradle.kts',
    urduTitle: 'پروجیکٹ ڈھانچہ اور ڈیپینڈنسیز',
    filePath: 'app/build.gradle.kts',
    language: 'gradle',
    summary:
      'Complete 100% offline Android Studio folder layout with Jetpack Compose, Room SQLite, DataStore Preferences, and custom font/asset bundling.',
    code: `/*
================================================================================
COMPLETE ANDROID STUDIO PROJECT FOLDER STRUCTURE (100% OFFLINE)
================================================================================
Quran15LineTajweed/
├── gradle/libs.versions.toml
├── build.gradle.kts
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        ├── assets/
        │   ├── quran_15_line_hafizi.pdf    # Complete 619-page 15-Line Hafizi PDF (Mushaf Pg 2..611)
        │   ├── db/
        │   │   └── quran_offline_seed.db   # Pre-populated Mutashabihat + Sirat-ul-Jinan
        │   └── json/
        │       ├── surahs_114.json
        │       └── paras_30.json
        ├── res/
        │   ├── font/
        │   │   ├── al_qalam_quran_majeed.ttf
        │   │   └── jameel_noori_nastaleeq.ttf
        │   ├── drawable/
        │   │   ├── ic_islamic_corner_gold.xml
        │   │   └── bg_shamsa_emblem.xml
        │   └── values/
        │       ├── colors.xml              # #071E18 Emerald, #D4AF37 Gold, #FAF8F5 Ivory
        │       └── themes.xml
        └── java/com/tajweed/quran15line/
            ├── QuranApp.kt                 # Hilt / Singleton Database initialization
            ├── data/
            │   ├── local/
            │   │   ├── QuranDatabase.kt
            │   │   ├── dao/
            │   │   │   ├── BookmarkDao.kt
            │   │   │   ├── NoteDao.kt
            │   │   │   ├── MutashabihatDao.kt
            │   │   │   ├── SiratUlJinanDao.kt
            │   │   │   └── ReaderStateDao.kt
            │   │   └── entity/
            │   │       └── QuranEntities.kt
            │   └── repository/
            │       └── OfflineQuranRepository.kt
            ├── ui/
            │   ├── theme/
            │   │   ├── Color.kt
            │   │   ├── Type.kt             # Includes Jameel Noori Nastaleeq FontFamily
            │   │   └── Theme.kt
            │   ├── splash/SplashScreen.kt
            │   ├── dashboard/MainDashboardScreen.kt
            │   ├── reader/
            │   │   ├── QuranReaderActivity.kt
            │   │   ├── QuranReaderScreen.kt
            │   │   ├── BookPageCurlEngine.kt
            │   │   └── OrnamentalBorderBox.kt
            │   ├── indexes/
            │   │   ├── SurahIndexScreen.kt
            │   │   ├── ParaIndexScreen.kt
            │   │   └── MutashabihatScreen.kt
            │   ├── sirat/SiratUlJinanScreen.kt
            │   └── navigation/AppNavigationDrawer.kt
            └── viewmodel/QuranViewModel.kt
================================================================================
*/

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt.android)
}

android {
    namespace = "com.tajweed.quran15line"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.tajweed.quran15line"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    // Keep pre-packaged offline 15-Line PDF & SQLite database uncompressed for instant PdfRenderer/mmap reads
    androidResources {
        noCompress += listOf("db", "sqlite", "pdf")
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.foundation:foundation") // HorizontalPager & VerticalPager
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // Room SQLite (100% Offline Bookmarks, Notes, Mutashabihat & Sirat-ul-Jinan)
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // DataStore for Brightness, FlipMode & Last-Read fast persistence
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Fast Offline WebP / Asset Image Decoding
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Hilt Dependency Injection
    implementation("com.google.dagger:hilt-android:2.52")
    ksp("com.google.dagger:hilt-android-compiler:2.52")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
}`,
  },
  {
    id: 'room-schema',
    title: '02. Room Database Entities & DAOs',
    urduTitle: 'روم ڈیٹابیس اسکیم اور کیوریز',
    filePath: 'data/local/QuranEntities.kt',
    language: 'kotlin',
    summary:
      'Production Room SQLite entities and reactive Flow DAOs for Bookmarks, Favorites, Study Notes, Line Highlights, Mutashabihat, Sirat-ul-Jinan Tafsir, and Last-Read State.',
    code: `package com.tajweed.quran15line.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// 1. Saved Bookmarks (محفوظ صفحات)
@Entity(tableName = "bookmarks")
data class BookmarkEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val pageNumber: Int,
    val surahNumber: Int,
    val surahNameUrdu: String,
    val paraNumber: Int,
    val label: String,
    val createdAt: Long = System.currentTimeMillis()
)

// 2. Favorites (پسندیدہ سورتیں و صفحات)
@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val itemType: String, // "SURAH" or "PAGE"
    val surahNumber: Int,
    val pageNumber: Int,
    val titleArabic: String,
    val titleUrdu: String,
    val createdAt: Long = System.currentTimeMillis()
)

// 3. Personal Notes & Hifz Line Highlights (ذاتی نوٹس اور نشاندہی)
@Entity(tableName = "study_notes")
data class StudyNoteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val pageNumber: Int,
    val lineNumber: Int, // 1..15 in Indo-Pak Mushaf
    val surahName: String,
    val noteText: String,
    val highlightHex: String = "#D4AF37", // Gold / Emerald / Crimson
    val updatedAt: Long = System.currentTimeMillis()
)

// 4. Mutashabihat Index for Huffaz (متشابہاتِ قرآن)
@Entity(tableName = "mutashabihat", indices = [Index("paraNumber"), Index("surahNumber")])
data class MutashabihEntity(
    @PrimaryKey val id: String,
    val paraNumber: Int,
    val surahNumber: Int,
    val surahName: String,
    val arabicPhrase: String,
    val pageNumber: Int,
    val lineNumber: Int,
    val category: String,
    val hifzTipUrdu: String,
    val similarLocationsJson: String // JSON array of paired Surah/Page/Line spots
)

// 5. Sirat-ul-Jinan Offline Tarjuma & Tafsir (صراط الجنان)
@Entity(tableName = "sirat_ul_jinan", indices = [Index("paraNumber"), Index("surahNumber")])
data class SiratUlJinanEntity(
    @PrimaryKey val id: String,
    val paraNumber: Int,
    val surahNumber: Int,
    val surahArabic: String,
    val surahUrdu: String,
    val ayahRange: String,
    val pageNumber: Int,
    val arabicText: String,
    val urduTranslation: String,
    val urduTafsir: String
)

// 6. Single-row Last Read Position (جہاں سے ختم کیا وہیں سے شروع)
@Entity(tableName = "last_read_state")
data class LastReadStateEntity(
    @PrimaryKey val keyId: Int = 1,
    val pageNumber: Int = 2, // Mushaf Page 2 (Al-Fatihah -> PDF Page index 2)
    val paraNumber: Int = 1,
    val surahName: String = "الفاتحة",
    val flipMode: String = "CURL_3D", // CURL_3D | SWIPE_HORIZONTAL | SWIPE_VERTICAL
    val appBrightness: Float = 1.0f,
    val comfortWarmMode: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
)

@Dao
interface BookmarkDao {
    @Query("SELECT * FROM bookmarks ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<BookmarkEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM bookmarks WHERE pageNumber = :page)")
    fun isPageBookmarked(page: Int): Flow<Boolean>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(bookmark: BookmarkEntity)

    @Query("DELETE FROM bookmarks WHERE pageNumber = :page")
    suspend fun deleteByPage(page: Int)
}

@Dao
interface NoteDao {
    @Query("SELECT * FROM study_notes WHERE pageNumber = :page ORDER BY lineNumber ASC")
    fun observeNotesForPage(page: Int): Flow<List<StudyNoteEntity>>

    @Query("SELECT * FROM study_notes ORDER BY updatedAt DESC")
    fun observeAllNotes(): Flow<List<StudyNoteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertNote(note: StudyNoteEntity)

    @Delete
    suspend fun deleteNote(note: StudyNoteEntity)
}

@Dao
interface MutashabihatDao {
    @Query("""
        SELECT * FROM mutashabihat
        WHERE (:para = -1 OR paraNumber = :para)
          AND (arabicPhrase LIKE '%' || :q || '%' OR surahName LIKE '%' || :q || '%' OR hifzTipUrdu LIKE '%' || :q || '%')
        ORDER BY paraNumber ASC, pageNumber ASC, lineNumber ASC
    """)
    fun searchMutashabihat(q: String, para: Int): Flow<List<MutashabihEntity>>
}

@Dao
interface SiratUlJinanDao {
    @Query("SELECT * FROM sirat_ul_jinan WHERE paraNumber = :para ORDER BY pageNumber ASC")
    fun observeByPara(para: Int): Flow<List<SiratUlJinanEntity>>

    @Query("SELECT * FROM sirat_ul_jinan WHERE surahNumber = :surah ORDER BY pageNumber ASC")
    fun observeBySurah(surah: Int): Flow<List<SiratUlJinanEntity>>
}

@Dao
interface ReaderStateDao {
    @Query("SELECT * FROM last_read_state WHERE keyId = 1")
    fun observeLastRead(): Flow<LastReadStateEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveState(state: LastReadStateEntity)
}

@Database(
    entities = [
        BookmarkEntity::class,
        FavoriteEntity::class,
        StudyNoteEntity::class,
        MutashabihEntity::class,
        SiratUlJinanEntity::class,
        LastReadStateEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class QuranDatabase : RoomDatabase() {
    abstract fun bookmarkDao(): BookmarkDao
    abstract fun noteDao(): NoteDao
    abstract fun mutashabihatDao(): MutashabihatDao
    abstract fun siratUlJinanDao(): SiratUlJinanDao
    abstract fun readerStateDao(): ReaderStateDao

    companion object {
        fun build(context: android.content.Context): QuranDatabase =
            Room.databaseBuilder(context, QuranDatabase::class.java, "quran_15line_offline.db")
                .createFromAsset("db/quran_offline_seed.db")
                .fallbackToDestructiveMigration()
                .build()
    }
}`,
  },
  {
    id: 'page-curl-arch',
    title: '03. 3D Page Curl + PDF Swipe Architecture',
    urduTitle: 'تھری ڈی صفحہ پلٹنے کا نظام',
    filePath: 'ui/reader/BookPageCurlEngine.kt',
    language: 'kotlin',
    summary:
      'Step-by-step dual page-turning engine combining RTL HorizontalPager/VerticalPager PDF swipe with a hardware-accelerated 3D Book Page Curl shader/graphicsLayer transition.',
    code: `package com.tajweed.quran15line.ui.reader

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import kotlinx.coroutines.launch
import kotlin.math.abs

enum class FlipMode { CURL_3D, SWIPE_HORIZONTAL, SWIPE_VERTICAL }

/**
 * Step-by-Step 3D Page Curl + PDF Swipe Architecture:
 * 1. Enforce RTL LayoutDirection so page 1 -> page 2 turns naturally right-to-left like a physical Mushaf.
 * 2. In SWIPE_HORIZONTAL / SWIPE_VERTICAL mode, delegate to Compose Foundation's zero-jank Pager.
 * 3. In CURL_3D mode, track horizontal finger drag delta in [curlProgress] (0f..1f),
 *    apply 3D perspective rotationY via graphicsLayer(cameraDistance = 16f),
 *    and draw a dynamic spine shadow + curled back-face highlight in drawWithContent.
 */
@Composable
fun DualModeQuranPager(
    totalPages: Int,
    currentPage: Int,
    flipMode: FlipMode,
    onPageChanged: (Int) -> Unit,
    pageContent: @Composable (pageNumber: Int) -> Unit
) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        when (flipMode) {
            FlipMode.SWIPE_HORIZONTAL -> {
                val pagerState = rememberPagerState(
                    initialPage = (currentPage - 1).coerceIn(0, totalPages - 1),
                    pageCount = { totalPages }
                )
                LaunchedEffect(currentPage) {
                    if (pagerState.currentPage != currentPage - 1) {
                        pagerState.animateScrollToPage(currentPage - 1)
                    }
                }
                LaunchedEffect(pagerState.settledPage) {
                    onPageChanged(pagerState.settledPage + 1)
                }
                HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { idx ->
                    pageContent(idx + 1)
                }
            }

            FlipMode.SWIPE_VERTICAL -> {
                val pagerState = rememberPagerState(
                    initialPage = (currentPage - 1).coerceIn(0, totalPages - 1),
                    pageCount = { totalPages }
                )
                LaunchedEffect(pagerState.settledPage) {
                    onPageChanged(pagerState.settledPage + 1)
                }
                VerticalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { idx ->
                    pageContent(idx + 1)
                }
            }

            FlipMode.CURL_3D -> {
                BookPageCurl3DHost(
                    currentPage = currentPage,
                    totalPages = totalPages,
                    onPageChanged = onPageChanged,
                    pageContent = pageContent
                )
            }
        }
    }
}

@Composable
private fun BookPageCurl3DHost(
    currentPage: Int,
    totalPages: Int,
    onPageChanged: (Int) -> Unit,
    pageContent: @Composable (Int) -> Unit
) {
    val scope = rememberCoroutineScope()
    val curlProgress = remember { Animatable(0f) } // -1f (prev) .. 0f (rest) .. +1f (next)
    var targetPage by remember(currentPage) { mutableIntStateOf(currentPage) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(currentPage, totalPages) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        scope.launch {
                            val v = curlProgress.value
                            when {
                                v > 0.25f && currentPage < totalPages -> {
                                    targetPage = currentPage + 1
                                    curlProgress.animateTo(1f, tween(280, easing = FastOutSlowInEasing))
                                    onPageChanged(currentPage + 1)
                                    curlProgress.snapTo(0f)
                                }
                                v < -0.25f && currentPage > 1 -> {
                                    targetPage = currentPage - 1
                                    curlProgress.animateTo(-1f, tween(280, easing = FastOutSlowInEasing))
                                    onPageChanged(currentPage - 1)
                                    curlProgress.snapTo(0f)
                                }
                                else -> curlProgress.animateTo(0f, tween(220))
                            }
                        }
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        scope.launch {
                            // RTL: dragging right turns forward in Mushaf
                            val delta = dragAmount / size.width.toFloat()
                            curlProgress.snapTo((curlProgress.value + delta).coerceIn(-1f, 1f))
                        }
                    }
                )
            }
    ) {
        val nextOrPrev = if (curlProgress.value >= 0f) (currentPage + 1).coerceAtMost(totalPages)
                         else (currentPage - 1).coerceAtLeast(1)

        // Underlying revealed page
        if (abs(curlProgress.value) > 0.01f) {
            pageContent(nextOrPrev)
        }

        // Top curling page with 3D perspective & realistic paper fold shadow
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    val p = curlProgress.value
                    cameraDistance = 18f * density
                    transformOrigin = if (p >= 0f) TransformOrigin(0f, 0.5f) else TransformOrigin(1f, 0.5f)
                    rotationY = -p * 72f
                    scaleX = 1f - abs(p) * 0.06f
                }
                .drawWithContent {
                    drawContent()
                    val foldIntensity = abs(curlProgress.value).coerceIn(0f, 1f)
                    if (foldIntensity > 0.01f) {
                        drawRect(
                            brush = Brush.horizontalGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.28f * foldIntensity),
                                    Color.Transparent,
                                    Color(0xFFD4AF37).copy(alpha = 0.12f * foldIntensity)
                                ),
                                startX = 0f,
                                endX = size.width
                            )
                        )
                    }
                }
        ) {
            pageContent(currentPage)
        }
    }
}`,
  },
  {
    id: 'splash-dashboard',
    title: '04. Splash Screen & Main Dashboard',
    urduTitle: 'اسپلیش اسکرین اور مرکزی ڈیش بورڈ',
    filePath: 'ui/splash/SplashScreen.kt',
    language: 'kotlin',
    summary:
      'Enchanting Royal Emerald (#071E18) & Burnished Gold (#D4AF37) Islamic Splash Screen with Canvas geometric star filigree + Main Dashboard featuring One-Tap Continue Reading.',
    code: `package com.tajweed.quran15line.ui.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin

val RoyalEmeraldDark = Color(0xFF071E18)
val MatteObsidian = Color(0xFF0A0E0C)
val RoyalGold = Color(0xFFD4AF37)
val IvoryPaper = Color(0xFFFAF8F5)

@Composable
fun IslamicSplashScreen(onFinished: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "shamsa")
    val slowRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(42000, easing = LinearEasing)),
        label = "rotation"
    )
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(tween(2400), RepeatMode.Reverse),
        label = "glow"
    )

    LaunchedEffect(Unit) {
        delay(2200)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF0E3328), RoyalEmeraldDark, MatteObsidian),
                    radius = 1200f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Intricate Rotating 16-Point Golden Islamic Geometric Star Pattern
        Canvas(modifier = Modifier.size(300.dp)) {
            drawCircle(
                brush = Brush.radialGradient(
                    listOf(RoyalGold.copy(alpha = glowAlpha), Color.Transparent)
                ),
                radius = size.minDimension * 0.58f
            )
            rotate(slowRotation) {
                val cx = size.width / 2f
                val cy = size.height / 2f
                val r = size.minDimension * 0.42f
                for (layer in 0..1) {
                    val path = Path()
                    val offsetAngle = layer * 22.5f
                    for (i in 0..7) {
                        val angle = Math.toRadians((i * 45.0) + offsetAngle)
                        val x = cx + r * cos(angle).toFloat()
                        val y = cy + r * sin(angle).toFloat()
                        if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                    }
                    path.close()
                    drawPath(path, RoyalGold.copy(alpha = 0.72f), style = Stroke(width = 2.5f))
                }
            }
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "القرآن الکریم",
                color = RoyalGold,
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "۱۵ سطری تجویدی مصحف · صراط الجنان",
                color = IvoryPaper.copy(alpha = 0.88f),
                fontSize = 15.sp
            )
        }
    }
}

@Composable
fun MainDashboardScreen(
    lastReadPage: Int,
    lastReadSurah: String,
    lastReadPara: Int,
    onContinueReading: (Int) -> Unit,
    onOpenJumpDialog: () -> Unit,
    onOpenSurahs: () -> Unit,
    onOpenParas: () -> Unit,
    onOpenMutashabihat: () -> Unit,
    onOpenSiratUlJinan: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(RoyalEmeraldDark)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // One-Tap Resume Reading Hero Card (جہاں سے ختم کیا وہیں سے شروع)
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, RoyalGold.copy(alpha = 0.45f), RoundedCornerShape(20.dp))
                .clickable { onContinueReading(lastReadPage) },
            color = Color(0xFF0D2921),
            shape = RoundedCornerShape(20.dp)
        ) {
            Row(
                modifier = Modifier.padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("جہاں سے ختم کیا وہیں سے شروع", color = RoyalGold, fontSize = 14.sp)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "$lastReadSurah · Page $lastReadPage",
                        color = IvoryPaper,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text("Para $lastReadPara · 15-Line Indo-Pak", color = IvoryPaper.copy(alpha = 0.7f), fontSize = 13.sp)
                }
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.MenuBook,
                    contentDescription = "Continue Reading",
                    tint = RoyalGold,
                    modifier = Modifier.size(36.dp)
                )
            }
        }

        // Quick Action Grid for Indexes & Sirat-ul-Jinan
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DashboardTile("Surah Index\nسورتوں کی فہرست", Modifier.weight(1f), onOpenSurahs)
            DashboardTile("Para Index\nپاروں کی فہرست", Modifier.weight(1f), onOpenParas)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DashboardTile("Mutashabihat\nمتشابہاتِ قرآن", Modifier.weight(1f), onOpenMutashabihat)
            DashboardTile("Sirat-ul-Jinan\nصراط الجنان تفسیر", Modifier.weight(1f), onOpenSiratUlJinan)
        }
        OutlinedButton(
            onClick = onOpenJumpDialog,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = RoyalGold)
        ) {
            Text("Go to Page Number (2 - 611) · صفحہ نمبر پر جائیں")
        }
    }
}

@Composable
private fun DashboardTile(title: String, modifier: Modifier, onClick: () -> Unit) {
    Surface(
        modifier = modifier
            .height(96.dp)
            .border(1.dp, RoyalGold.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        color = Color(0xFF0C241D),
        shape = RoundedCornerShape(16.dp)
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(12.dp)) {
            Text(title, color = IvoryPaper, fontSize = 14.sp)
        }
    }
}`,
  },
  {
    id: 'reader-border',
    title: '05. Quran Reader Activity & Ornamental Border',
    urduTitle: 'قرآن ریڈر، چمک کنٹرول اور حاشیہ',
    filePath: 'ui/reader/QuranReaderScreen.kt',
    language: 'kotlin',
    summary:
      'Crisp #FAF8F5 ivory paper with #000000 jet-black calligraphy, Royal Gold (#D4AF37) & Matte Black (#121212) Islamic Canvas border, in-app window brightness slider, and Hifz line notes.',
    code: `package com.tajweed.quran15line.ui.reader

import android.app.Activity
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.asImageBitmap
import java.io.File

@Composable
fun OrnamentalPdfQuranPage(
    mushafPage: Int, // 0=Cover, 1=Title, 2..611=Quran Text, 612..618=Rumooz/Index
    highlightedLines: Set<Int>,
    comfortWarmMode: Boolean,
    onLineTap: (Int) -> Unit
) {
    val context = LocalContext.current
    val paperColor = if (comfortWarmMode) Color(0xFFF3E9D2) else Color(0xFFFAF8F5)
    val royalGold = Color(0xFFD4AF37)
    val matteBlack = Color(0xFF121212)

    // Render exact PDF page offline using Android's native PdfRenderer
    val pageBitmap by produceState<Bitmap?>(initialValue = null, mushafPage) {
        val pdfFile = File(context.filesDir, "quran_15_line_hafizi.pdf")
        if (!pdfFile.exists()) {
            context.assets.open("quran_15_line_hafizi.pdf").use { input ->
                pdfFile.outputStream().use { output -> input.copyTo(output) }
            }
        }
        ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY).use { pfd ->
            PdfRenderer(pfd).use { renderer ->
                val pdfIndex = mushafPage.coerceIn(0, renderer.pageCount - 1)
                renderer.openPage(pdfIndex).use { page ->
                    val bmp = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
                    bmp.eraseColor(android.graphics.Color.WHITE)
                    page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    value = bmp
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(paperColor)
            .padding(10.dp)
    ) {
        // Traditional Royal Gold & Matte Black Islamic Ornamental Frame
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawRoundRect(
                color = matteBlack,
                cornerRadius = CornerRadius(12f, 12f),
                style = Stroke(width = 6f)
            )
            drawRoundRect(
                color = royalGold,
                topLeft = Offset(10f, 10f),
                size = Size(size.width - 20f, size.height - 20f),
                cornerRadius = CornerRadius(8f, 8f),
                style = Stroke(width = 3f)
            )
        }

        pageBitmap?.let { bmp ->
            Image(
                bitmap = bmp.asImageBitmap(),
                contentDescription = "15-Line Hafizi Mushaf Page $mushafPage",
                modifier = Modifier.fillMaxSize().padding(8.dp)
            )
        }

        // Interactive 15-Line Hifz Revision Overlay (Quran Text Pages 2..611)
        if (mushafPage in 2..611) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp, vertical = 38.dp),
                verticalArrangement = Arrangement.SpaceEvenly
            ) {
                for (lineNo in 1..15) {
                    val isMarked = highlightedLines.contains(lineNo)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .background(if (isMarked) royalGold.copy(alpha = 0.22f) else Color.Transparent)
                            .clickable { onLineTap(lineNo) }
                    )
                }
            }
        }
    }
}

@Composable
fun InAppBrightnessController(
    brightness: Float,
    comfortMode: Boolean,
    onBrightnessChange: (Float) -> Unit,
    onToggleComfort: () -> Unit
) {
    val activity = LocalContext.current as? Activity
    // Apply independent in-app brightness directly to the Activity Window
    LaunchedEffect(brightness) {
        activity?.window?.let { win ->
            val lp = win.attributes
            lp.screenBrightness = brightness.coerceIn(0.05f, 1.0f)
            win.attributes = lp
        }
    }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Text("Reader Brightness (\${(brightness * 100).toInt()}%)", color = Color.White)
        Slider(value = brightness, onValueChange = onBrightnessChange, valueRange = 0.1f..1.0f)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Reading Comfort Mode (Warm Ivory)", color = Color.White)
            Switch(checked = comfortMode, onCheckedChange = { onToggleComfort() })
        }
    }
}`,
  },
  {
    id: 'drawer-sirat',
    title: '06. Navigation Drawer & Sirat-ul-Jinan Screen',
    urduTitle: 'نیویگیشن مینو اور صراط الجنان',
    filePath: 'ui/navigation/AppNavigationDrawer.kt',
    language: 'kotlin',
    summary:
      'Bilingual Urdu/English Navigation Drawer containing all 8 required sections plus offline Sirat-ul-Jinan Tarjuma & Tafsir view rendered with Jameel Noori Nastaleeq font.',
    code: `package com.tajweed.quran15line.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tajweed.quran15line.R
import com.tajweed.quran15line.data.local.SiratUlJinanEntity

// Load offline Jameel Noori Nastaleeq font from res/font/
val JameelNooriNastaleeq = FontFamily(Font(R.font.jameel_noori_nastaleeq))

@Composable
fun AppNavigationDrawerContent(
    selectedRoute: String,
    onNavigate: (String) -> Unit
) {
    val menuItems = listOf(
        "dashboard" to "Home / Continue Reading · جہاں سے ختم کیا",
        "bookmarks" to "Saved Bookmarks · محفوظ صفحات",
        "favorites" to "Favorites · پسندیدہ",
        "notes" to "Personal Notes · ذاتی نوٹس",
        "mutashabihat" to "Mutashabihat List · متشابہات",
        "sirat_ul_jinan" to "Sirat-ul-Jinan Folder · صراط الجنان",
        "settings" to "Settings & Page Flip Mode · ترتیبات",
        "about" to "About App · ہمارے بارے میں"
    )

    ModalDrawerSheet(
        drawerContainerColor = Color(0xFF071E18),
        drawerContentColor = Color(0xFFFAF8F5)
    ) {
        Text(
            text = "القرآن الکریم — ۱۵ سطری",
            color = Color(0xFFD4AF37),
            fontSize = 22.sp,
            modifier = Modifier.padding(20.dp)
        )
        HorizontalDivider(color = Color(0xFFD4AF37).copy(alpha = 0.25f))
        menuItems.forEach { (route, label) ->
            NavigationDrawerItem(
                label = { Text(label, fontFamily = JameelNooriNastaleeq, fontSize = 15.sp) },
                selected = selectedRoute == route,
                onClick = { onNavigate(route) },
                colors = NavigationDrawerItemDefaults.colors(
                    selectedContainerColor = Color(0xFFD4AF37).copy(alpha = 0.18f),
                    selectedTextColor = Color(0xFFD4AF37),
                    unselectedTextColor = Color(0xFFFAF8F5)
                )
            )
        }
    }
}

@Composable
fun SiratUlJinanOfflineFolderScreen(entries: List<SiratUlJinanEntity>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        items(entries, key = { it.id }) { item ->
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF0C241D))) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(item.surahUrdu + " · " + item.ayahRange, color = Color(0xFFD4AF37), fontFamily = JameelNooriNastaleeq)
                    Spacer(Modifier.height(8.dp))
                    Text(item.arabicText, color = Color.White, fontSize = 20.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(item.urduTranslation, color = Color(0xFFFAF8F5), fontFamily = JameelNooriNastaleeq, fontSize = 17.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(item.urduTafsir, color = Color(0xFFD6CEBE), fontFamily = JameelNooriNastaleeq, fontSize = 16.sp)
                }
            }
        }
    }
}`,
  },
];
