allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

subprojects {
    project.configurations.all {
        resolutionStrategy.eachDependency {
            if (requested.group == "com.android.support" && !requested.name.startsWith("multidex")) {
                useVersion("28.0.0")
            }
        }
    }
}

subprojects {
    project.plugins.withId("com.android.application") {
        project.extensions.getByType<com.android.build.gradle.BaseExtension>().compileSdkVersion(36)
    }
    project.plugins.withId("com.android.library") {
        project.extensions.getByType<com.android.build.gradle.BaseExtension>().compileSdkVersion(36)
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
