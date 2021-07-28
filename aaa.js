const chalk = require('chalk');
const execa = require('execa');
// const { prompt } = require('enquirer');

// const versionRegex = /^\d+\.\d+\.\d+$/;
const step = msg => console.log(chalk.yellowBright(msg));
const success = msg => console.log(chalk.greenBright(msg));
const notice = msg => console.log(chalk.yellow(msg));
const error = msg => console.log(chalk.redBright(msg));

const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: `inherit`, ...opts });

const getGitBranch = () =>
  execa.commandSync('git rev-parse --abbrev-ref HEAD').stdout;

async function main() {
  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' });
  if (stdout) {
    step('\n添加 git 追踪');
    await run(`git`, [`add`, `-A`]);

    await run(`git-cz`);
    // await run(`git`, [`commit`, `-m`, `111`]);
    notice(`run完git commit子进程颜色没有丢失`);
  } else {
    notice('\n没有更新的文件');
  }

  await run(`git`, [`push`]);
  notice(`run完git commit子进程颜色丢失`);
  step('\n切换到 dev 分支并拉取最新代码');
  await run(`git`, [`checkout`, `dev`]);
  await run(`git`, [`pull`, `origin`, `dev`]);

  // 合并提交分支
  await run(`git`, [`merge`, currentBranch]);

  // 推送dev
  success('\n合并到 dev 分支完成');

  step('\n推送到远端');
  await run(`git`, [`push`]);

  success('\n推送 dev 完成，稍后 Jenkins 将启动构建并通知');

  step('\n切换回到 ${currentBranch} 分支');
  await run(`git`, [`checkout`, currentBranch]);

  success('\n发布测试环境完成');
  return;
}

const currentBranch = getGitBranch();

main()
  .catch(async err => {
    error(err);
    step(`切换回到 ${currentBranch} 分支`);
    await run(`git`, [`checkout`, currentBranch]);
  })
  .finally(() => {
    notice('\n完成辣');
  });
